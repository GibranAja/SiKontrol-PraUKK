/**
 * GET /api/recycle-bin/kategori
 * Get all soft-deleted categories
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

    const deletedKategori = await prisma.kategori.findMany({
      where: {
        deleted_at: { not: null },
      },
      select: {
        id_kategori: true,
        nama_kategori: true,
        deskripsi: true,
        deleted_at: true,
      },
      orderBy: { deleted_at: 'desc' },
    })

    return formatResponse(deletedKategori)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get deleted kategori error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
