/**
 * GET /api/laporan/alat-terbanyak
 * Top borrowed equipment report
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

    // Parse query params
    const query = getQuery(event)
    const limit = query.limit ? parseInt(query.limit as string) : 10
    const periode = (query.periode as string) || 'all' // all, month, year

    // Build date filter based on periode
    let dateFilter: any = {}
    const now = new Date()

    if (periode === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      dateFilter = { gte: startOfMonth }
    } else if (periode === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      dateFilter = { gte: startOfYear }
    }

    // Get borrowing counts per alat
    const borrowCounts = await prisma.peminjaman.groupBy({
      by: ['id_alat'],
      where: {
        status_peminjaman: {
          in: ['DISETUJUI', 'DIPINJAM', 'DIKEMBALIKAN'],
        },
        ...(Object.keys(dateFilter).length > 0
          ? { tanggal_pengajuan: dateFilter }
          : {}
        ),
      },
      _count: {
        id_peminjaman: true,
      },
      orderBy: {
        _count: {
          id_peminjaman: 'desc',
        },
      },
      take: limit,
    })

    // Get alat details
    const alatIds = borrowCounts.map(b => b.id_alat)
    const alatDetails = await prisma.alat.findMany({
      where: {
        id_alat: { in: alatIds },
      },
      select: {
        id_alat: true,
        kode_alat: true,
        nama_alat: true,
        gambar: true,
        kategori: {
          select: { nama_kategori: true },
        },
      },
    })

    // Map details to counts
    const alatMap = new Map(alatDetails.map(a => [a.id_alat, a]))

    const data = borrowCounts.map((b, index) => {
      const alat = alatMap.get(b.id_alat)
      return {
        rank: index + 1,
        id_alat: b.id_alat,
        kode_alat: alat?.kode_alat || '-',
        nama_alat: alat?.nama_alat || '-',
        kategori: alat?.kategori?.nama_kategori || '-',
        gambar: alat?.gambar || null,
        total_peminjaman: b._count.id_peminjaman,
      }
    })

    // Get total loans for percentage calc
    const totalLoans = await prisma.peminjaman.count({
      where: {
        status_peminjaman: {
          in: ['DISETUJUI', 'DIPINJAM', 'DIKEMBALIKAN'],
        },
        ...(Object.keys(dateFilter).length > 0
          ? { tanggal_pengajuan: dateFilter }
          : {}
        ),
      },
    })

    // Add percentage
    const dataWithPercentage = data.map(item => ({
      ...item,
      persentase: totalLoans > 0
        ? parseFloat(((item.total_peminjaman / totalLoans) * 100).toFixed(2))
        : 0,
    }))

    // Get category breakdown
    const categoryStats = await prisma.peminjaman.groupBy({
      by: ['id_alat'],
      where: {
        status_peminjaman: {
          in: ['DISETUJUI', 'DIPINJAM', 'DIKEMBALIKAN'],
        },
        ...(Object.keys(dateFilter).length > 0
          ? { tanggal_pengajuan: dateFilter }
          : {}
        ),
      },
      _count: {
        id_peminjaman: true,
      },
    })

    // Get all alat with kategori for mapping
    const allAlatIds = categoryStats.map(c => c.id_alat)
    const allAlatWithKategori = await prisma.alat.findMany({
      where: { id_alat: { in: allAlatIds } },
      select: { id_alat: true, id_kategori: true, kategori: { select: { nama_kategori: true } } },
    })

    const alatKategoriMap = new Map(allAlatWithKategori.map(a => [a.id_alat, a]))

    // Aggregate by category
    const categoryBreakdown: Record<string, { nama: string; total: number }> = {}

    for (const stat of categoryStats) {
      const alat = alatKategoriMap.get(stat.id_alat)
      if (alat) {
        const kategoriId = alat.id_kategori
        const kategoriNama = alat.kategori.nama_kategori
        if (!categoryBreakdown[kategoriId]) {
          categoryBreakdown[kategoriId] = { nama: kategoriNama, total: 0 }
        }
        categoryBreakdown[kategoriId].total += stat._count.id_peminjaman
      }
    }

    const categoryData = Object.entries(categoryBreakdown)
      .map(([id, data]) => ({
        id_kategori: id,
        nama_kategori: data.nama,
        total_peminjaman: data.total,
        persentase: totalLoans > 0
          ? parseFloat(((data.total / totalLoans) * 100).toFixed(2))
          : 0,
      }))
      .sort((a, b) => b.total_peminjaman - a.total_peminjaman)

    return formatResponse({
      periode: periode === 'month'
        ? now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        : periode === 'year'
          ? now.getFullYear().toString()
          : 'Semua Waktu',
      total_peminjaman: totalLoans,
      top_alat: dataWithPercentage,
      by_kategori: categoryData,
    })
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get laporan alat terbanyak error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
