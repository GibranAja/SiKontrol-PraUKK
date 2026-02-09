/**
 * GET /api/kategori/:id
 * Get category detail with equipment count
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { idParamSchema } from '~~/server/utils/validators'
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

    const kategori = await prisma.kategori.findUnique({
      where: {
        id_kategori: id,
        deleted_at: null,
      },
      include: {
        alat: {
          where: { deleted_at: null },
          select: {
            id_alat: true,
            nama_alat: true,
            kode_alat: true,
            stok: true,
            kondisi: true,
          },
        },
        _count: {
          select: {
            alat: {
              where: { deleted_at: null },
            },
          },
        },
      },
    })

    if (!kategori) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Kategori tidak ditemukan'),
      })
    }

    return formatResponse(kategori)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get kategori detail error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
