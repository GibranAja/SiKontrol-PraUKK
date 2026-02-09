/**
 * GET /api/log-aktivitas/statistics
 * Get activity statistics (Admin only)
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
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat melihat statistik'),
      })
    }

    // Get date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(today)
    thisWeek.setDate(thisWeek.getDate() - 7)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get counts
    const [
      totalLogs,
      todayLogs,
      thisWeekLogs,
      thisMonthLogs,
      loginCount,
      registerCount,
      peminjamanCount,
      pengembalianCount,
    ] = await Promise.all([
      prisma.logAktivitas.count(),
      prisma.logAktivitas.count({ where: { timestamp: { gte: today } } }),
      prisma.logAktivitas.count({ where: { timestamp: { gte: thisWeek } } }),
      prisma.logAktivitas.count({ where: { timestamp: { gte: thisMonth } } }),
      prisma.logAktivitas.count({ where: { aktivitas: 'LOGIN' } }),
      prisma.logAktivitas.count({ where: { aktivitas: 'REGISTER' } }),
      prisma.logAktivitas.count({ where: { aktivitas: 'AJUKAN_PEMINJAMAN' } }),
      prisma.logAktivitas.count({ where: { aktivitas: 'PROSES_PENGEMBALIAN' } }),
    ])

    // Get top active users
    const topUsers = await prisma.logAktivitas.groupBy({
      by: ['id_user'],
      _count: {
        id_log: true,
      },
      orderBy: {
        _count: {
          id_log: 'desc',
        },
      },
      take: 5,
    })

    // Get user details for top users
    const topUsersWithDetails = await Promise.all(
      topUsers.map(async (u) => {
        const userDetails = await prisma.users.findUnique({
          where: { id_user: u.id_user },
          select: {
            id_user: true,
            username: true,
            nama_lengkap: true,
            role: true,
          },
        })
        return {
          ...userDetails,
          activity_count: u._count.id_log,
        }
      })
    )

    // Get recent activity types breakdown
    const activityBreakdown = await prisma.logAktivitas.groupBy({
      by: ['aktivitas'],
      _count: {
        id_log: true,
      },
      where: {
        timestamp: { gte: thisMonth },
      },
      orderBy: {
        _count: {
          id_log: 'desc',
        },
      },
      take: 10,
    })

    return formatResponse({
      counts: {
        total: totalLogs,
        today: todayLogs,
        this_week: thisWeekLogs,
        this_month: thisMonthLogs,
      },
      activity_types: {
        login: loginCount,
        register: registerCount,
        peminjaman: peminjamanCount,
        pengembalian: pengembalianCount,
      },
      top_active_users: topUsersWithDetails,
      activity_breakdown: activityBreakdown.map(a => ({
        aktivitas: a.aktivitas,
        count: a._count.id_log,
      })),
    })
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get log statistics error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
