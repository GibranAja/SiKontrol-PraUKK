/**
 * GET /api/users/:id
 * Get user detail with statistics
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { idParamSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    const currentUser = event.context.user

    if (!currentUser) {
      throw createError({
        statusCode: 401,
        data: formatErrorResponse('UNAUTHORIZED', 'Tidak terautentikasi'),
      })
    }

    // Validate ID
    const params = event.context.params
    const validation = idParamSchema.safeParse(params)

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'ID tidak valid'),
      })
    }

    const { id } = validation.data

    // Check permission - only admin/petugas can see other users
    if (currentUser.role === 'PEMINJAM' && currentUser.id_user !== id) {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Tidak memiliki akses'),
      })
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: {
        id_user: id,
        deleted_at: null,
      },
      select: {
        id_user: true,
        username: true,
        nama_lengkap: true,
        role: true,
        kelas: true,
        jenis_kelamin: true,
        status_akun: true,
        created_at: true,
      },
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'User tidak ditemukan'),
      })
    }

    // Get statistics
    const [
      totalPeminjaman,
      peminjamanAktif,
      peminjamanTerlambat,
      totalDenda,
      dendaBelumBayar,
    ] = await Promise.all([
      prisma.peminjaman.count({
        where: { id_user: id },
      }),
      prisma.peminjaman.count({
        where: {
          id_user: id,
          status_peminjaman: 'DIPINJAM',
        },
      }),
      prisma.peminjaman.count({
        where: {
          id_user: id,
          status_peminjaman: 'DIPINJAM',
          tanggal_harus_kembali: { lt: new Date() },
        },
      }),
      prisma.pengembalian.aggregate({
        where: {
          peminjaman: { id_user: id },
        },
        _sum: { denda: true },
      }),
      prisma.pengembalian.aggregate({
        where: {
          peminjaman: { id_user: id },
          status_denda: 'BELUM_BAYAR',
        },
        _sum: { denda: true },
      }),
    ])

    // Get recent peminjaman
    const recentPeminjaman = await prisma.peminjaman.findMany({
      where: { id_user: id },
      select: {
        id_peminjaman: true,
        kode_peminjaman: true,
        status_peminjaman: true,
        tanggal_pengajuan: true,
        tanggal_harus_kembali: true,
        alat: {
          select: {
            nama_alat: true,
            kode_alat: true,
          },
        },
      },
      orderBy: { tanggal_pengajuan: 'desc' },
      take: 5,
    })

    return formatResponse({
      ...user,
      statistics: {
        total_peminjaman: totalPeminjaman,
        peminjaman_aktif: peminjamanAktif,
        peminjaman_terlambat: peminjamanTerlambat,
        total_denda: totalDenda._sum.denda || 0,
        denda_belum_bayar: dendaBelumBayar._sum.denda || 0,
      },
      recent_peminjaman: recentPeminjaman,
    })
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get user detail error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
