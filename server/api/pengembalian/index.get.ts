/**
 * GET /api/pengembalian
 * List all returns with filters
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { paginationSchema } from '~~/server/utils/validators'
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
    const validation = paginationSchema.safeParse(query)

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Parameter tidak valid'),
      })
    }

    const { page, limit } = validation.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // PEMINJAM can only see their own returns
    if (user.role === 'PEMINJAM') {
      where.peminjaman = {
        id_user: user.id_user,
      }
    }

    // Get total count
    const total = await prisma.pengembalian.count({ where })

    // Get returns
    const pengembalian = await prisma.pengembalian.findMany({
      where,
      select: {
        id_pengembalian: true,
        tanggal_kembali_actual: true,
        denda: true,
        status_denda: true,
        kondisi_alat_saat_kembali: true,
        catatan_pengembalian: true,
        peminjaman: {
          select: {
            id_peminjaman: true,
            kode_peminjaman: true,
            tanggal_pinjam: true,
            tanggal_harus_kembali: true,
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
              },
            },
          },
        },
        verifikator: {
          select: {
            id_user: true,
            nama_lengkap: true,
          },
        },
      },
      orderBy: { tanggal_kembali_actual: 'desc' },
      skip,
      take: limit,
    })

    return formatPaginatedResponse(pengembalian, page, limit, total)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get pengembalian error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
