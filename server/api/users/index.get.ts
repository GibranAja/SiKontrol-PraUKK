/**
 * GET /api/users
 * List all users with pagination and filters
 * Admin/Petugas only
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { userFilterSchema } from '~~/server/utils/validators'
import { formatPaginatedResponse, formatErrorResponse } from '~~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    // Admin and Petugas can see all users
    if (!user || !['ADMIN', 'PETUGAS'].includes(user.role)) {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Tidak memiliki akses'),
      })
    }

    // Parse query params
    const query = getQuery(event)
    const validation = userFilterSchema.safeParse(query)

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Parameter tidak valid'),
      })
    }

    const { search, role, status_akun, page, limit } = validation.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      deleted_at: null,
    }

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { nama_lengkap: { contains: search } },
        { kelas: { contains: search } },
      ]
    }

    if (role) {
      where.role = role
    }

    if (status_akun) {
      where.status_akun = status_akun
    }

    // Get total count
    const total = await prisma.users.count({ where })

    // Get users
    const users = await prisma.users.findMany({
      where,
      select: {
        id_user: true,
        username: true,
        nama_lengkap: true,
        role: true,
        kelas: true,
        jenis_kelamin: true,
        status_akun: true,
        created_at: true,
        _count: {
          select: {
            peminjaman: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    })

    return formatPaginatedResponse(users, page, limit, total)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get users error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
