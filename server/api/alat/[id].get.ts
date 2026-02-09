/**
 * GET /api/alat/:id
 * Get equipment detail with loan history
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { idParamSchema } from '~~/server/utils/validators'
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

    const alat = await prisma.alat.findUnique({
      where: {
        id_alat: id,
        deleted_at: null,
      },
      include: {
        kategori: {
          select: {
            id_kategori: true,
            nama_kategori: true,
          },
        },
      },
    })

    if (!alat) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Alat tidak ditemukan'),
      })
    }

    // Get loan statistics
    const [totalPeminjaman, peminjamanAktif, recentPeminjaman] = await Promise.all([
      prisma.peminjaman.count({
        where: { id_alat: id },
      }),
      prisma.peminjaman.count({
        where: {
          id_alat: id,
          status_peminjaman: 'DIPINJAM',
        },
      }),
      prisma.peminjaman.findMany({
        where: { id_alat: id },
        select: {
          id_peminjaman: true,
          kode_peminjaman: true,
          status_peminjaman: true,
          tanggal_pinjam: true,
          tanggal_harus_kembali: true,
          user: {
            select: {
              id_user: true,
              nama_lengkap: true,
              kelas: true,
            },
          },
        },
        orderBy: { tanggal_pengajuan: 'desc' },
        take: 10,
      }),
    ])

    return formatResponse({
      ...alat,
      statistics: {
        total_peminjaman: totalPeminjaman,
        peminjaman_aktif: peminjamanAktif,
      },
      recent_peminjaman: recentPeminjaman,
    })
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get alat detail error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
