/**
 * GET /api/peminjaman
 * List all loans with filters (Admin/Petugas see all, Peminjam sees own)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { peminjamanFilterSchema } from '~~/server/utils/validators'
import { formatPaginatedResponse, formatErrorResponse } from '~~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        data: formatErrorResponse('UNAUTHORIZED', 'Tidak terautentikasi'),
      })
    }

    // Parse query params
    const query = getQuery(event)
    const validation = peminjamanFilterSchema.safeParse(query)

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Parameter tidak valid'),
      })
    }

    const { search, status, id_user, tanggal_dari, tanggal_sampai, page, limit } = validation.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // PEMINJAM can only see their own loans
    if (user.role === 'PEMINJAM') {
      where.id_user = user.id_user
    } else if (id_user) {
      where.id_user = id_user
    }

    if (search) {
      where.OR = [
        { kode_peminjaman: { contains: search, mode: 'insensitive' } },
        { alat: { nama_alat: { contains: search, mode: 'insensitive' } } },
        { users: { nama_lengkap: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status) {
      where.status_peminjaman = status
    }

    if (tanggal_dari) {
      where.tanggal_pengajuan = { ...where.tanggal_pengajuan, gte: tanggal_dari }
    }

    if (tanggal_sampai) {
      where.tanggal_pengajuan = { ...where.tanggal_pengajuan, lte: tanggal_sampai }
    }

    // Get total count
    const total = await prisma.peminjaman.count({ where })

    // Get loans
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
        alasan_ditolak: true,
        catatan_petugas: true,
        user: {
          select: {
            id_user: true,
            nama_lengkap: true,
            kelas: true,
          },
        },
        alat: {
          select: {
            id_alat: true,
            nama_alat: true,
            kode_alat: true,
            kondisi: true,
          },
        },
        pengembalian: {
          select: {
            id_pengembalian: true,
            tanggal_kembali_actual: true,
            denda: true,
            status_denda: true,
          },
        },
      },
      orderBy: { tanggal_pengajuan: 'desc' },
      skip,
      take: limit,
    })

    // Add computed fields
    const peminjamanWithComputed = peminjaman.map(p => ({
      ...p,
      is_overdue: p.status_peminjaman === 'DIPINJAM' &&
        p.tanggal_harus_kembali &&
        new Date() > new Date(p.tanggal_harus_kembali),
    }))

    return formatPaginatedResponse(peminjamanWithComputed, page, limit, total)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get peminjaman error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
