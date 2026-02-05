/**
 * PATCH /api/peminjaman/:id/cancel
 * Cancel loan request (Peminjam only, only if MENUNGGU_PERSETUJUAN)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
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

    // Get peminjaman
    const peminjaman = await prisma.peminjaman.findUnique({
      where: { id_peminjaman: id },
      include: {
        alat: {
          select: {
            nama_alat: true,
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

    // Check ownership (only PEMINJAM can cancel their own)
    if (user.role === 'PEMINJAM' && peminjaman.id_user !== user.id_user) {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Tidak memiliki akses'),
      })
    }

    // Check status
    if (peminjaman.status_peminjaman !== 'MENUNGGU_PERSETUJUAN') {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          'Hanya peminjaman dengan status MENUNGGU_PERSETUJUAN yang dapat dibatalkan'
        ),
      })
    }

    // Update to DITOLAK (cancelled)
    const updatedPeminjaman = await prisma.peminjaman.update({
      where: { id_peminjaman: id },
      data: {
        status_peminjaman: 'DITOLAK',
        alasan_ditolak: 'Dibatalkan oleh peminjam',
      },
      select: {
        id_peminjaman: true,
        kode_peminjaman: true,
        status_peminjaman: true,
      },
    })

    // Log activity
    await logActivityFromEvent(
      event,
      AktivitasType.CANCEL_PEMINJAMAN,
      `Membatalkan peminjaman ${peminjaman.kode_peminjaman} untuk alat ${peminjaman.alat.nama_alat}`
    )

    return formatResponse(updatedPeminjaman, undefined, 'Peminjaman berhasil dibatalkan')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Cancel peminjaman error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
