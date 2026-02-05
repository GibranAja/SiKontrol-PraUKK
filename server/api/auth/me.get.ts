/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
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

    // Get fresh user data with statistics
    const userData = await prisma.users.findUnique({
      where: { id_user: user.id_user },
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
    })

    if (!userData) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'User tidak ditemukan'),
      })
    }

    // Get active loans count
    const activePeminjaman = await prisma.peminjaman.count({
      where: {
        id_user: user.id_user,
        status_peminjaman: 'DIPINJAM',
      },
    })

    // Get pending returns (overdue)
    const overduePeminjaman = await prisma.peminjaman.count({
      where: {
        id_user: user.id_user,
        status_peminjaman: 'DIPINJAM',
        tanggal_harus_kembali: {
          lt: new Date(),
        },
      },
    })

    // Get unpaid fines
    const unpaidDenda = await prisma.pengembalian.aggregate({
      where: {
        peminjaman: {
          id_user: user.id_user,
        },
        status_denda: 'BELUM_BAYAR',
      },
      _sum: {
        denda: true,
      },
    })

    return formatResponse({
      ...userData,
      statistics: {
        total_peminjaman: userData._count.peminjaman,
        peminjaman_aktif: activePeminjaman,
        peminjaman_terlambat: overduePeminjaman,
        total_denda_belum_bayar: unpaidDenda._sum.denda || 0,
      },
    })
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get me error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
