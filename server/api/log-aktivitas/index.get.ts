/**
 * GET /api/log-aktivitas
 * List activity logs (Admin only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { logFilterSchema } from '~~/server/utils/validators'
import { formatPaginatedResponse, formatErrorResponse } from '~~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat melihat log aktivitas'),
      })
    }

    // Parse query params
    const query = getQuery(event)
    const validation = logFilterSchema.safeParse(query)

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Parameter tidak valid'),
      })
    }

    const { id_user, aktivitas, tanggal_dari, tanggal_sampai, page, limit } = validation.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (id_user) {
      where.id_user = id_user
    }

    if (aktivitas) {
      where.aktivitas = { contains: aktivitas }
    }

    if (tanggal_dari) {
      where.timestamp = { ...where.timestamp, gte: tanggal_dari }
    }

    if (tanggal_sampai) {
      where.timestamp = { ...where.timestamp, lte: tanggal_sampai }
    }

    // Get total count
    const total = await prisma.logAktivitas.count({ where })

    // Get logs
    const logs = await prisma.logAktivitas.findMany({
      where,
      select: {
        id_log: true,
        aktivitas: true,
        detail: true,
        ip_address: true,
        timestamp: true,
        user: {
          select: {
            id_user: true,
            username: true,
            nama_lengkap: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    })

    return formatPaginatedResponse(logs, page, limit, total)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get log aktivitas error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
