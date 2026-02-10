/**
 * GET /api/recycle-bin/users
 * Get all soft-deleted users
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
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin/petugas yang dapat mengakses recycle bin'),
      })
    }

    const deletedUsers = await prisma.users.findMany({
      where: {
        deleted_at: { not: null },
      },
      select: {
        id_user: true,
        username: true,
        nama_lengkap: true,
        role: true,
        kelas: true,
        jenis_kelamin: true,
        status_akun: true,
        deleted_at: true,
      },
      orderBy: { deleted_at: 'desc' },
    })

    return formatResponse(deletedUsers)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get deleted users error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
