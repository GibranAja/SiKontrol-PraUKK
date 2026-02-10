/**
 * PATCH /api/recycle-bin/kategori/:id/restore
 * Restore a soft-deleted category
 * Admin only
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || !['ADMIN', 'PETUGAS'].includes(user.role)) {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin/petugas yang dapat memulihkan data'),
      })
    }

    const id = parseInt(event.context.params?.id || '0')

    if (!id) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'ID tidak valid'),
      })
    }

    const existingKategori = await prisma.kategori.findUnique({
      where: { id_kategori: id },
    })

    if (!existingKategori) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Kategori tidak ditemukan'),
      })
    }

    if (!existingKategori.deleted_at) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Kategori tidak ada di recycle bin'),
      })
    }

    const restoredKategori = await prisma.kategori.update({
      where: { id_kategori: id },
      data: { deleted_at: null },
    })

    return formatResponse(restoredKategori, undefined, 'Kategori berhasil dipulihkan')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Restore kategori error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
