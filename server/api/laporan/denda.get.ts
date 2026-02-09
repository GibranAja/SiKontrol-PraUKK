/**
 * GET /api/laporan/denda
 * Rekap denda report
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { laporanDendaSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { StatusDendaDisplay } from '~~/server/utils/enums'

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
    const validation = laporanDendaSchema.safeParse(query)

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Parameter tidak valid'),
      })
    }

    const { tanggal_dari, tanggal_sampai, status_denda } = validation.data

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (tanggal_dari) dateFilter.gte = tanggal_dari
    if (tanggal_sampai) dateFilter.lte = tanggal_sampai

    // Get pengembalian with denda in the period
    const pengembalianDenda = await prisma.pengembalian.findMany({
      where: {
        denda: { gt: 0 },
        ...(Object.keys(dateFilter).length > 0 && { tanggal_kembali_actual: dateFilter }),
        ...(status_denda && { status_denda }),
      },
      select: {
        id_pengembalian: true,
        tanggal_kembali_actual: true,
        denda: true,
        status_denda: true,
        catatan_pengembalian: true,
        peminjaman: {
          select: {
            kode_peminjaman: true,
            tanggal_harus_kembali: true,
            user: {
              select: {
                nama_lengkap: true,
                kelas: true,
              },
            },
            alat: {
              select: { nama_alat: true },
            },
          },
        },
      },
      orderBy: { tanggal_kembali_actual: 'desc' },
    })

    // Calculate summary
    const summary = {
      total_denda: pengembalianDenda.reduce((sum, p) => sum + p.denda, 0),
      total_transaksi: pengembalianDenda.length,
      by_status: {
        BELUM_BAYAR: {
          jumlah: 0,
          total: 0,
        },
        LUNAS: {
          jumlah: 0,
          total: 0,
        },
        DICICIL: {
          jumlah: 0,
          total: 0,
        },
        WAIVED: {
          jumlah: 0,
          total: 0,
        },
      } as Record<string, { jumlah: number; total: number }>,
    }

    for (const p of pengembalianDenda) {
      const statusEntry = summary.by_status[p.status_denda]
      if (statusEntry) {
        statusEntry.jumlah++
        statusEntry.total += p.denda
      }
    }

    // Calculate late days for each
    const data = pengembalianDenda.map(p => {
      const hariTerlambat = p.peminjaman.tanggal_harus_kembali
        ? Math.max(0, Math.floor((p.tanggal_kembali_actual.getTime() - p.peminjaman.tanggal_harus_kembali.getTime()) / (1000 * 60 * 60 * 24)))
        : 0
      return {
        id_pengembalian: p.id_pengembalian,
        tanggal_kembali: p.tanggal_kembali_actual,
        kode_peminjaman: p.peminjaman.kode_peminjaman,
        nama_peminjam: p.peminjaman.user.nama_lengkap,
        kelas: p.peminjaman.user.kelas,
        nama_alat: p.peminjaman.alat.nama_alat,
        hari_terlambat: hariTerlambat,
        denda: p.denda,
        denda_formatted: `Rp ${p.denda.toLocaleString('id-ID')}`,
        status_denda: p.status_denda,
        status_denda_display: StatusDendaDisplay[p.status_denda],
        catatan: p.catatan_pengembalian,
      }
    })

    return formatResponse({
      filter: {
        tanggal_dari: tanggal_dari || null,
        tanggal_sampai: tanggal_sampai || null,
        status_denda: status_denda || null,
      },
      summary: {
        total_denda: summary.total_denda,
        total_denda_formatted: `Rp ${summary.total_denda.toLocaleString('id-ID')}`,
        total_transaksi: summary.total_transaksi,
        by_status: Object.entries(summary.by_status).map(([status, data]) => ({
          status,
          status_display: StatusDendaDisplay[status as keyof typeof StatusDendaDisplay] || status,
          jumlah: data.jumlah,
          total: data.total,
          total_formatted: `Rp ${data.total.toLocaleString('id-ID')}`,
        })),
      },
      data,
    })
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get laporan denda error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
