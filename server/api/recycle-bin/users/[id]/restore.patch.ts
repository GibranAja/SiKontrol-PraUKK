/**
 * PATCH /api/recycle-bin/users/:id/restore
 * Restore a soft-deleted user
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

    // Check if user exists and is deleted
    const existingUser = await prisma.users.findUnique({
      where: { id_user: id },
    })

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'User tidak ditemukan'),
      })
    }

    if (!existingUser.deleted_at) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'User tidak ada di recycle bin'),
      })
    }

    // Restore user
    const restoredUser = await prisma.users.update({
      where: { id_user: id },
      data: { deleted_at: null },
    })

    return formatResponse(restoredUser, undefined, 'User berhasil dipulihkan')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Restore user error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
