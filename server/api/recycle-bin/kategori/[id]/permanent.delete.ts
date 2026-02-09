/**
 * DELETE /api/recycle-bin/kategori/:id/permanent
 * Permanently delete a soft-deleted category
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
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat menghapus permanen'),
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

    await prisma.kategori.delete({
      where: { id_kategori: id },
    })

    return formatResponse({ success: true }, undefined, 'Kategori berhasil dihapus permanen')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Permanent delete kategori error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
