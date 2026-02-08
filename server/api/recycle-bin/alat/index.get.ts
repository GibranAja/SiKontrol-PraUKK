/**
 * GET /api/recycle-bin/alat
 * Get all soft-deleted equipment
 * Admin only
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat mengakses recycle bin'),
      })
    }

    const deletedAlat = await prisma.alat.findMany({
      where: {
        deleted_at: { not: null },
      },
      select: {
        id_alat: true,
        nama_alat: true,
        kode_alat: true,
        stok: true,
        kondisi: true,
        gambar: true,
        deleted_at: true,
        kategori: {
          select: {
            nama_kategori: true,
          },
        },
      },
      orderBy: { deleted_at: 'desc' },
    })

    return formatResponse(deletedAlat)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get deleted alat error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
