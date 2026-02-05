/**
 * GET /api/pengembalian/overdue
 * List overdue loans (for reminders)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { paginationSchema } from '~~/server/utils/validators'
import { formatPaginatedResponse, formatErrorResponse, getDaysOverdue } from '~~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || !['ADMIN', 'PETUGAS'].includes(user.role)) {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Tidak memiliki akses'),
      })
    }

    // Parse query params
    const query = getQuery(event)
    const validation = paginationSchema.safeParse(query)

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Parameter tidak valid'),
      })
    }

    const { page, limit } = validation.data
    const skip = (page - 1) * limit

    // Get overdue loans
    const where = {
      status_peminjaman: 'DIPINJAM' as const,
      tanggal_harus_kembali: {
        lt: new Date(),
      },
    }

    const total = await prisma.peminjaman.count({ where })

    const overdue = await prisma.peminjaman.findMany({
      where,
      select: {
        id_peminjaman: true,
        kode_peminjaman: true,
        tanggal_pinjam: true,
        tanggal_harus_kembali: true,
        user: {
          select: {
            id_user: true,
            nama_lengkap: true,
            kelas: true,
            status_akun: true,
          },
        },
        alat: {
          select: {
            id_alat: true,
            nama_alat: true,
            kode_alat: true,
          },
        },
      },
      orderBy: { tanggal_harus_kembali: 'asc' },
      skip,
      take: limit,
    })

    // Add days overdue
    const overdueWithDays = overdue.map(p => ({
      ...p,
      days_overdue: getDaysOverdue(p.tanggal_harus_kembali!),
    }))

    return formatPaginatedResponse(overdueWithDays, page, limit, total)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get overdue error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
