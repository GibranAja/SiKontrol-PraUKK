/**
 * POST /api/perpanjangan/:id/verify
 * Verify (approve/reject) extension request (Admin/Petugas only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { verifyPerpanjanganSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse, calculateNewDueDate } from '~~/server/utils/helpers'
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
    const idIndex = pathParts.findIndex(p => p === 'perpanjangan') + 1
    const id = parseInt(pathParts[idIndex] || '0')

    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'ID tidak valid'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = verifyPerpanjanganSchema.safeParse(body)

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

    const { action, alasan_ditolak_admin } = validation.data

    // Get perpanjangan with peminjaman
    const perpanjangan = await prisma.perpanjangan.findUnique({
      where: { id_perpanjangan: id },
      include: {
        peminjaman: {
          include: {
            alat: {
              select: {
                nama_alat: true,
              },
            },
          },
        },
        pengaju: {
          select: {
            nama_lengkap: true,
          },
        },
      },
    })

    if (!perpanjangan) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Perpanjangan tidak ditemukan'),
      })
    }

    // Check status
    if (perpanjangan.status_perpanjangan !== 'MENUNGGU') {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          `Perpanjangan tidak dapat diverifikasi. Status saat ini: ${perpanjangan.status_perpanjangan}`
        ),
      })
    }

    // Check peminjaman status
    if (perpanjangan.peminjaman.status_peminjaman !== 'DIPINJAM') {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          'Peminjaman sudah tidak aktif'
        ),
      })
    }

    if (action === 'DISETUJUI') {
      // Calculate new due date
      if (!perpanjangan.peminjaman.tanggal_harus_kembali) {
        throw createError({
          statusCode: 400,
          data: formatErrorResponse('VALIDATION_ERROR', 'Tanggal jatuh tempo tidak tersedia'),
        })
      }

      const newDueDate = calculateNewDueDate(
        perpanjangan.peminjaman.tanggal_harus_kembali,
        perpanjangan.durasi_tambahan_hari
      )

      // Use transaction for atomic operation
      const [updatedPerpanjangan] = await prisma.$transaction([
        // Update perpanjangan
        prisma.perpanjangan.update({
          where: { id_perpanjangan: id },
          data: {
            status_perpanjangan: 'DISETUJUI',
            tgl_disetujui: new Date(),
            id_petugas_verifikator: user.id_user,
          },
          include: {
            peminjaman: {
              select: {
                kode_peminjaman: true,
                tanggal_harus_kembali: true,
              },
            },
          },
        }),
        // Update peminjaman due date
        prisma.peminjaman.update({
          where: { id_peminjaman: perpanjangan.id_peminjaman },
          data: {
            tanggal_harus_kembali: newDueDate,
          },
        }),
      ])

      // Log activity
      await logActivityFromEvent(
        event,
        AktivitasType.SETUJUI_PERPANJANGAN,
        `Menyetujui perpanjangan ${perpanjangan.durasi_tambahan_hari} hari untuk peminjaman ${perpanjangan.peminjaman.kode_peminjaman}. Tanggal baru: ${newDueDate.toLocaleDateString('id-ID')}`
      )

      return formatResponse({
        ...updatedPerpanjangan,
        new_due_date: newDueDate,
      }, undefined, 'Perpanjangan berhasil disetujui')
    } else {
      // DITOLAK
      if (!alasan_ditolak_admin) {
        throw createError({
          statusCode: 400,
          data: formatErrorResponse('VALIDATION_ERROR', 'Alasan penolakan wajib diisi'),
        })
      }

      const updatedPerpanjangan = await prisma.perpanjangan.update({
        where: { id_perpanjangan: id },
        data: {
          status_perpanjangan: 'DITOLAK',
          alasan_ditolak_admin,
          id_petugas_verifikator: user.id_user,
        },
      })

      // Log activity
      await logActivityFromEvent(
        event,
        AktivitasType.TOLAK_PERPANJANGAN,
        `Menolak perpanjangan untuk peminjaman ${perpanjangan.peminjaman.kode_peminjaman}. Alasan: ${alasan_ditolak_admin}`
      )

      return formatResponse(updatedPerpanjangan, undefined, 'Perpanjangan ditolak')
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Verify perpanjangan error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
