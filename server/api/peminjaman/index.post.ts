/**
 * POST /api/peminjaman
 * Create new loan request (Peminjam only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { createPeminjamanSchema } from '~~/server/utils/validators'
import {
  formatResponse,
  formatErrorResponse,
  generateKodePeminjaman,
  getMaxPeminjamanSimultan,
} from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        data: formatErrorResponse('UNAUTHORIZED', 'Tidak terautentikasi'),
      })
    }

    // Only PEMINJAM can create loans
    if (user.role !== 'PEMINJAM') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya peminjam yang dapat mengajukan peminjaman'),
      })
    }

    // Check if user account is active
    if (user.status_akun !== 'AKTIF') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Akun Anda tidak aktif atau diblokir'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = createPeminjamanSchema.safeParse(body)

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

    const { id_alat, alasan_peminjaman, keperluan_lainnya } = validation.data

    // Check maximum simultaneous loans
    const maxPeminjaman = getMaxPeminjamanSimultan()
    const activePeminjaman = await prisma.peminjaman.count({
      where: {
        id_user: user.id_user,
        status_peminjaman: {
          in: ['MENUNGGU_PERSETUJUAN', 'DISETUJUI', 'DIPINJAM'],
        },
      },
    })

    if (activePeminjaman >= maxPeminjaman) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          `Anda sudah memiliki ${activePeminjaman} peminjaman aktif. Maksimal ${maxPeminjaman} peminjaman simultan.`
        ),
      })
    }

    // Check if equipment exists and available
    const alat = await prisma.alat.findUnique({
      where: { id_alat, deleted_at: null },
    })

    if (!alat) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Alat tidak ditemukan'),
      })
    }

    // Check stock
    if (alat.stok <= 0) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Stok alat tidak tersedia'),
      })
    }

    // Check equipment condition
    if (!['BAIK', 'RUSAK_RINGAN'].includes(alat.kondisi)) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          'Alat tidak dapat dipinjam karena kondisinya tidak memungkinkan'
        ),
      })
    }

    // Check if user already has pending/active loan for this equipment
    const existingLoan = await prisma.peminjaman.findFirst({
      where: {
        id_user: user.id_user,
        id_alat,
        status_peminjaman: {
          in: ['MENUNGGU_PERSETUJUAN', 'DISETUJUI', 'DIPINJAM'],
        },
      },
    })

    if (existingLoan) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          'Anda sudah memiliki peminjaman aktif untuk alat ini'
        ),
      })
    }

    // Generate unique code
    let kode_peminjaman = generateKodePeminjaman()

    // Ensure uniqueness
    const existingCode = await prisma.peminjaman.findUnique({
      where: { kode_peminjaman },
    })

    if (existingCode) {
      kode_peminjaman = generateKodePeminjaman()
    }

    // Create loan
    const peminjaman = await prisma.peminjaman.create({
      data: {
        id_user: user.id_user,
        id_alat,
        kode_peminjaman,
        alasan_peminjaman,
        keperluan_lainnya,
        status_peminjaman: 'MENUNGGU_PERSETUJUAN',
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
      AktivitasType.AJUKAN_PEMINJAMAN,
      `Mengajukan peminjaman ${kode_peminjaman} untuk alat ${alat.nama_alat}`
    )

    return formatResponse(peminjaman, undefined, 'Peminjaman berhasil diajukan')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Create peminjaman error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
