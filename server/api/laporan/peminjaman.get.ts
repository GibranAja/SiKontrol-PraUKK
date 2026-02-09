/**
 * GET /api/laporan/peminjaman
 * Export peminjaman report (JSON/CSV)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { laporanPeminjamanSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse, formatDate } from '~~/server/utils/helpers'
import { StatusPeminjamanDisplay } from '~~/server/utils/enums'

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
    const validation = laporanPeminjamanSchema.safeParse(query)

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Parameter tidak valid'),
      })
    }

    const { tanggal_dari, tanggal_sampai, status, format } = validation.data

    // Build where clause
    const where: any = {}

    if (tanggal_dari) {
      where.tanggal_pengajuan = { ...where.tanggal_pengajuan, gte: tanggal_dari }
    }

    if (tanggal_sampai) {
      where.tanggal_pengajuan = { ...where.tanggal_pengajuan, lte: tanggal_sampai }
    }

    if (status) {
      where.status_peminjaman = status
    }

    // Get data
    const peminjaman = await prisma.peminjaman.findMany({
      where,
      select: {
        id_peminjaman: true,
        kode_peminjaman: true,
        tanggal_pengajuan: true,
        tanggal_pinjam: true,
        tanggal_harus_kembali: true,
        alasan_peminjaman: true,
        status_peminjaman: true,
        user: {
          select: {
            nama_lengkap: true,
            kelas: true,
          },
        },
        alat: {
          select: {
            nama_alat: true,
            kode_alat: true,
            kategori: {
              select: { nama_kategori: true },
            },
          },
        },
        pengembalian: {
          select: {
            tanggal_kembali_actual: true,
            denda: true,
            status_denda: true,
          },
        },
      },
      orderBy: { tanggal_pengajuan: 'desc' },
    })

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Kode Peminjaman',
        'Nama Peminjam',
        'Kelas',
        'Nama Alat',
        'Kode Alat',
        'Kategori',
        'Tanggal Pengajuan',
        'Tanggal Pinjam',
        'Tanggal Harus Kembali',
        'Tanggal Dikembalikan',
        'Status',
        'Denda',
        'Status Denda',
      ].join(',')

      const rows = peminjaman.map(p => [
        p.kode_peminjaman,
        `"${p.user.nama_lengkap}"`,
        p.user.kelas,
        `"${p.alat.nama_alat}"`,
        p.alat.kode_alat,
        p.alat.kategori.nama_kategori,
        p.tanggal_pengajuan.toISOString().split('T')[0],
        p.tanggal_pinjam?.toISOString().split('T')[0] || '',
        p.tanggal_harus_kembali?.toISOString().split('T')[0] || '',
        p.pengembalian?.tanggal_kembali_actual?.toISOString().split('T')[0] || '',
        StatusPeminjamanDisplay[p.status_peminjaman],
        p.pengembalian?.denda || 0,
        p.pengembalian?.status_denda || '',
      ].join(','))

      const csv = [headers, ...rows].join('\n')

      setHeader(event, 'Content-Type', 'text/csv')
      setHeader(event, 'Content-Disposition', 'attachment; filename=laporan-peminjaman.csv')

      return csv
    }

    // Return JSON
    return formatResponse({
      total: peminjaman.length,
      periode: {
        dari: tanggal_dari || null,
        sampai: tanggal_sampai || null,
      },
      data: peminjaman,
    })
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get laporan peminjaman error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
