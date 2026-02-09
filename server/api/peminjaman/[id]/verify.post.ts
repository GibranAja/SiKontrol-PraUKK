/**
 * POST /api/peminjaman/:id/verify
 * Verify (approve/reject) loan request (Admin/Petugas only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { verifyPeminjamanSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse, addDays, getDefaultDurasiPinjam } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || !['ADMIN', 'PETUGAS'].includes(user.role)) {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Tidak memiliki akses'),
      })
    }

    // Get ID from path
    const pathParts = event.path.split('/')
    const idIndex = pathParts.findIndex(p => p === 'peminjaman') + 1
    const id = parseInt(pathParts[idIndex] || '0')

    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'ID tidak valid'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = verifyPeminjamanSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))

      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Data tidak valid', errors),
      })
    }

    const { action, catatan_petugas, alasan_ditolak, durasi_pinjam_hari } = validation.data

    // Get peminjaman with alat data
    const peminjaman = await prisma.peminjaman.findUnique({
      where: { id_peminjaman: id },
      include: {
        alat: true,
        user: {
          select: {
            nama_lengkap: true,
            status_akun: true,
          },
        },
      },
    })

    if (!peminjaman) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Peminjaman tidak ditemukan'),
      })
    }

    // Check current status
    if (peminjaman.status_peminjaman !== 'MENUNGGU_PERSETUJUAN') {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          `Peminjaman tidak dapat diverifikasi. Status saat ini: ${peminjaman.status_peminjaman}`
        ),
      })
    }

    // Check user account status
    if (peminjaman.user.status_akun !== 'AKTIF') {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          'Peminjam tidak aktif atau diblokir'
        ),
      })
    }

    if (action === 'DISETUJUI') {
      // Check stock availability
      if (peminjaman.alat.stok <= 0) {
        throw createError({
          statusCode: 400,
          data: formatErrorResponse(
            'VALIDATION_ERROR',
            'Stok alat tidak tersedia'
          ),
        })
      }

      // Use transaction for atomic operation
      const now = new Date()
      const durasiHari = durasi_pinjam_hari || getDefaultDurasiPinjam()
      const tanggalHarusKembali = addDays(now, durasiHari)

      const [updatedPeminjaman] = await prisma.$transaction([
        // Update peminjaman
        prisma.peminjaman.update({
          where: { id_peminjaman: id },
          data: {
            status_peminjaman: 'DIPINJAM',
            tanggal_pinjam: now,
            tanggal_harus_kembali: tanggalHarusKembali,
            catatan_petugas,
          },
          include: {
            alat: {
              select: {
                id_alat: true,
                nama_alat: true,
                kode_alat: true,
              },
            },
            user: {
              select: {
                nama_lengkap: true,
              },
            },
          },
        }),
        // Decrease stock
        prisma.alat.update({
          where: { id_alat: peminjaman.id_alat },
          data: {
            stok: { decrement: 1 },
          },
        }),
      ])

      // Log activity
      await logActivityFromEvent(
        event,
        AktivitasType.SETUJUI_PEMINJAMAN,
        `Menyetujui peminjaman ${peminjaman.kode_peminjaman} untuk ${peminjaman.user.nama_lengkap}. Alat: ${peminjaman.alat.nama_alat}`
      )

      return formatResponse(updatedPeminjaman, undefined, 'Peminjaman berhasil disetujui')
    } else {
      // DITOLAK
      if (!alasan_ditolak) {
        throw createError({
          statusCode: 400,
          data: formatErrorResponse('VALIDATION_ERROR', 'Alasan penolakan wajib diisi'),
        })
      }

      const updatedPeminjaman = await prisma.peminjaman.update({
        where: { id_peminjaman: id },
        data: {
          status_peminjaman: 'DITOLAK',
          alasan_ditolak,
          catatan_petugas,
        },
        include: {
          alat: {
            select: {
              id_alat: true,
              nama_alat: true,
              kode_alat: true,
            },
          },
        },
      })

      // Log activity
      await logActivityFromEvent(
        event,
        AktivitasType.TOLAK_PEMINJAMAN,
        `Menolak peminjaman ${peminjaman.kode_peminjaman}. Alasan: ${alasan_ditolak}`
      )

      return formatResponse(updatedPeminjaman, undefined, 'Peminjaman ditolak')
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Verify peminjaman error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
