/**
 * POST /api/perpanjangan
 * Request loan extension (Peminjam only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { createPerpanjanganSchema } from '~~/server/utils/validators'
import {
  formatResponse,
  formatErrorResponse,
  canRequestPerpanjangan,
  getMaxPerpanjanganHari,
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

    // Only PEMINJAM can request extensions
    if (user.role !== 'PEMINJAM') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya peminjam yang dapat mengajukan perpanjangan'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = createPerpanjanganSchema.safeParse(body)

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

    const { id_peminjaman, durasi_tambahan_hari, alasan_permintaan } = validation.data

    // Check max extension days
    const maxHari = getMaxPerpanjanganHari()
    if (durasi_tambahan_hari > maxHari) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          `Perpanjangan maksimal ${maxHari} hari`
        ),
      })
    }

    // Get peminjaman
    const peminjaman = await prisma.peminjaman.findUnique({
      where: { id_peminjaman },
      include: {
        alat: {
          select: {
            nama_alat: true,
          },
        },
        perpanjangan: {
          orderBy: { tanggal_pengajuan: 'desc' },
          take: 1,
        },
      },
    })

    if (!peminjaman) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Peminjaman tidak ditemukan'),
      })
    }

    // Check ownership
    if (peminjaman.id_user !== user.id_user) {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Tidak memiliki akses'),
      })
    }

    // Check peminjaman status
    if (peminjaman.status_peminjaman !== 'DIPINJAM') {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          'Hanya peminjaman dengan status DIPINJAM yang dapat diperpanjang'
        ),
      })
    }

    // Check if within extension window (3 days before due date)
    if (!peminjaman.tanggal_harus_kembali) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Tanggal jatuh tempo tidak tersedia'),
      })
    }

    if (!canRequestPerpanjangan(peminjaman.tanggal_harus_kembali)) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          'Perpanjangan hanya dapat diajukan maksimal 3 hari sebelum jatuh tempo dan sebelum melewati jatuh tempo'
        ),
      })
    }

    // Check for pending extension
    const pendingPerpanjangan = await prisma.perpanjangan.findFirst({
      where: {
        id_peminjaman,
        status_perpanjangan: 'MENUNGGU',
      },
    })

    if (pendingPerpanjangan) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          'Sudah ada pengajuan perpanjangan yang menunggu persetujuan'
        ),
      })
    }

    // Check if already extended (max 1 extension per loan)
    const approvedPerpanjangan = await prisma.perpanjangan.findFirst({
      where: {
        id_peminjaman,
        status_perpanjangan: 'DISETUJUI',
      },
    })

    if (approvedPerpanjangan) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          'Peminjaman ini sudah pernah diperpanjang. Maksimal 1x perpanjangan per peminjaman.'
        ),
      })
    }

    // Create extension request
    const perpanjangan = await prisma.perpanjangan.create({
      data: {
        id_peminjaman,
        id_user_pengaju: user.id_user,
        durasi_tambahan_hari,
        alasan_permintaan,
        status_perpanjangan: 'MENUNGGU',
      },
      include: {
        peminjaman: {
          select: {
            kode_peminjaman: true,
            tanggal_harus_kembali: true,
          },
        },
      },
    })

    // Log activity
    await logActivityFromEvent(
      event,
      AktivitasType.AJUKAN_PERPANJANGAN,
      `Mengajukan perpanjangan ${durasi_tambahan_hari} hari untuk peminjaman ${peminjaman.kode_peminjaman}`
    )

    return formatResponse(perpanjangan, undefined, 'Perpanjangan berhasil diajukan')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Create perpanjangan error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
