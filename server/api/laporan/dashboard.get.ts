/**
 * GET /api/laporan/dashboard
 * Dashboard summary statistics
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
        data: formatErrorResponse('FORBIDDEN', 'Tidak memiliki akses'),
      })
    }

    // Get counts
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      totalKategori,
      totalAlat,
      availableAlat,
      totalPeminjaman,
      pendingPeminjaman,
      activePeminjaman,
      overduePeminjaman,
      totalPengembalian,
      pendingDenda,
      unpaidDenda,
    ] = await Promise.all([
      // Users
      prisma.users.count({ where: { deleted_at: null } }),
      prisma.users.count({ where: { deleted_at: null, status_akun: 'AKTIF' } }),
      prisma.users.count({ where: { deleted_at: null, status_akun: 'DIBLOKIR' } }),

      // Kategori
      prisma.kategori.count({ where: { deleted_at: null } }),

      // Alat
      prisma.alat.count({ where: { deleted_at: null } }),
      prisma.alat.count({
        where: {
          deleted_at: null,
          stok: { gt: 0 },
          kondisi: { in: ['BAIK', 'RUSAK_RINGAN'] },
        },
      }),

      // Peminjaman
      prisma.peminjaman.count(),
      prisma.peminjaman.count({ where: { status_peminjaman: 'MENUNGGU_PERSETUJUAN' } }),
      prisma.peminjaman.count({ where: { status_peminjaman: 'DIPINJAM' } }),
      prisma.peminjaman.count({
        where: {
          status_peminjaman: 'DIPINJAM',
          tanggal_harus_kembali: { lt: new Date() },
        },
      }),

      // Pengembalian
      prisma.pengembalian.count(),
      prisma.perpanjangan.count({ where: { status_perpanjangan: 'MENUNGGU' } }),

      // Unpaid fines
      prisma.pengembalian.aggregate({
        where: { status_denda: 'BELUM_BAYAR' },
        _sum: { denda: true },
      }),
    ])

    // Get this month's statistics
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const [
      monthlyPeminjaman,
      monthlyPengembalian,
      monthlyNewUsers,
    ] = await Promise.all([
      prisma.peminjaman.count({ where: { tanggal_pengajuan: { gte: thisMonth } } }),
      prisma.pengembalian.count({ where: { tanggal_kembali_actual: { gte: thisMonth } } }),
      prisma.users.count({ where: { created_at: { gte: thisMonth } } }),
    ])

    // Get top borrowed equipment
    const topAlat = await prisma.peminjaman.groupBy({
      by: ['id_alat'],
      _count: { id_peminjaman: true },
      orderBy: { _count: { id_peminjaman: 'desc' } },
      take: 5,
    })

    const topAlatWithDetails = await Promise.all(
      topAlat.map(async (a) => {
        const alat = await prisma.alat.findUnique({
          where: { id_alat: a.id_alat },
          select: {
            id_alat: true,
            nama_alat: true,
            kode_alat: true,
            kategori: {
              select: { nama_kategori: true },
            },
          },
        })
        return {
          ...alat,
          peminjaman_count: a._count.id_peminjaman,
        }
      })
    )

    return formatResponse({
      users: {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers,
      },
      alat: {
        total_kategori: totalKategori,
        total: totalAlat,
        available: availableAlat,
      },
      peminjaman: {
        total: totalPeminjaman,
        pending: pendingPeminjaman,
        active: activePeminjaman,
        overdue: overduePeminjaman,
        pending_perpanjangan: pendingDenda,
      },
      pengembalian: {
        total: totalPengembalian,
        unpaid_denda: unpaidDenda._sum.denda || 0,
      },
      monthly: {
        peminjaman: monthlyPeminjaman,
        pengembalian: monthlyPengembalian,
        new_users: monthlyNewUsers,
      },
      top_alat: topAlatWithDetails,
    })
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get dashboard error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
