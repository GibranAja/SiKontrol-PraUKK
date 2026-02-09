/**
 * GET /api/kategori
 * List all categories
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        data: formatErrorResponse('UNAUTHORIZED', 'Tidak terautentikasi'),
      })
    }

    const kategori = await prisma.kategori.findMany({
      where: { deleted_at: null },
      select: {
        id_kategori: true,
        nama_kategori: true,
        deskripsi: true,
        _count: {
          select: {
            alat: {
              where: { deleted_at: null },
            },
          },
        },
      },
      orderBy: { nama_kategori: 'asc' },
    })

    return formatResponse(kategori)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get kategori error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
