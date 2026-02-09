/**
 * DELETE /api/alat/:id
 * Soft delete equipment (Admin only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { idParamSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat menghapus alat'),
      })
    }

    // Validate ID
    const params = event.context.params
    const validation = idParamSchema.safeParse(params)

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'ID tidak valid'),
      })
    }

    const { id } = validation.data

    // Check if exists
    const alat = await prisma.alat.findUnique({
      where: { id_alat: id, deleted_at: null },
    })

    if (!alat) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Alat tidak ditemukan'),
      })
    }

    // Check for active loans
    const activePeminjaman = await prisma.peminjaman.count({
      where: {
        id_alat: id,
        status_peminjaman: {
          in: ['MENUNGGU_PERSETUJUAN', 'DISETUJUI', 'DIPINJAM'],
        },
      },
    })

    if (activePeminjaman > 0) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          `Alat masih memiliki ${activePeminjaman} peminjaman aktif. Selesaikan peminjaman terlebih dahulu.`
        ),
      })
    }

    // Soft delete
    await prisma.alat.update({
      where: { id_alat: id },
      data: { deleted_at: new Date() },
    })

    // Log activity
    await logActivityFromEvent(
      event,
      AktivitasType.DELETE_ALAT,
      `Menghapus alat: ${alat.nama_alat} (${alat.kode_alat})`
    )

    return formatResponse(null, undefined, 'Alat berhasil dihapus')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Delete alat error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
