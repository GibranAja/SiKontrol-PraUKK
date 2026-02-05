/**
 * GET /api/peminjaman/me
 * Get current user's loans
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

    const { status, page, limit } = validation.data
    const skip = (page - 1) * limit

    // Build where clause - only user's own loans
    const where: any = {
      id_user: user.id_user,
    }

    if (status) {
      where.status_peminjaman = status
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
        alat: {
          select: {
            id_alat: true,
            nama_alat: true,
            kode_alat: true,
            kondisi: true,
            gambar: true,
          },
        },
        perpanjangan: {
          where: { status_perpanjangan: 'MENUNGGU' },
          select: {
            id_perpanjangan: true,
            status_perpanjangan: true,
          },
        },
        pengembalian: {
          select: {
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
      has_pending_perpanjangan: p.perpanjangan.length > 0,
    }))

    return formatPaginatedResponse(peminjamanWithComputed, page, limit, total)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get my peminjaman error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
