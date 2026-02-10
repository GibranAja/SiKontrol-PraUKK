/**
 * PATCH /api/recycle-bin/alat/:id/restore
 * Restore a soft-deleted equipment
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

    const existingAlat = await prisma.alat.findUnique({
      where: { id_alat: id },
    })

    if (!existingAlat) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Alat tidak ditemukan'),
      })
    }

    if (!existingAlat.deleted_at) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Alat tidak ada di recycle bin'),
      })
    }

    const restoredAlat = await prisma.alat.update({
      where: { id_alat: id },
      data: { deleted_at: null },
    })

    return formatResponse(restoredAlat, undefined, 'Alat berhasil dipulihkan')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Restore alat error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
