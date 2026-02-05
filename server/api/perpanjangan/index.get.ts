/**
 * GET /api/perpanjangan
 * List extension requests (Admin/Petugas see all, Peminjam sees own)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { perpanjanganFilterSchema } from '~~/server/utils/validators'
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
    const validation = perpanjanganFilterSchema.safeParse(query)

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Parameter tidak valid'),
      })
    }

    const { status, id_user, page, limit } = validation.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // PEMINJAM can only see their own
    if (user.role === 'PEMINJAM') {
      where.id_user_pengaju = user.id_user
    } else if (id_user) {
      where.id_user_pengaju = id_user
    }

    if (status) {
      where.status_perpanjangan = status
    }

    // Get total count
    const total = await prisma.perpanjangan.count({ where })

    // Get extensions
    const perpanjangan = await prisma.perpanjangan.findMany({
      where,
      select: {
        id_perpanjangan: true,
        tanggal_pengajuan: true,
        durasi_tambahan_hari: true,
        alasan_permintaan: true,
        status_perpanjangan: true,
        alasan_ditolak_admin: true,
        tgl_disetujui: true,
        peminjaman: {
          select: {
            id_peminjaman: true,
            kode_peminjaman: true,
            tanggal_harus_kembali: true,
            alat: {
              select: {
                nama_alat: true,
                kode_alat: true,
              },
            },
          },
        },
        pengaju: {
          select: {
            id_user: true,
            nama_lengkap: true,
            kelas: true,
          },
        },
        petugas_verifikator: {
          select: {
            id_user: true,
            nama_lengkap: true,
          },
        },
      },
      orderBy: { tanggal_pengajuan: 'desc' },
      skip,
      take: limit,
    })

    return formatPaginatedResponse(perpanjangan, page, limit, total)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get perpanjangan error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
