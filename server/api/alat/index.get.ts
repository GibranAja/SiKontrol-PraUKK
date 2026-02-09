/**
 * GET /api/alat
 * List all equipment with filters
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { alatFilterSchema } from '~~/server/utils/validators'
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
    const validation = alatFilterSchema.safeParse(query)

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Parameter tidak valid'),
      })
    }

    const { search, id_kategori, kondisi, tersedia, page, limit } = validation.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      deleted_at: null,
    }

    if (search) {
      where.OR = [
        { nama_alat: { contains: search } },
        { kode_alat: { contains: search } },
        { spesifikasi: { contains: search } },
      ]
    }

    if (id_kategori) {
      where.id_kategori = id_kategori
    }

    if (kondisi) {
      where.kondisi = kondisi
    }

    if (tersedia === true) {
      where.stok = { gt: 0 }
      where.kondisi = { in: ['BAIK', 'RUSAK_RINGAN'] }
    }

    // Get total count
    const total = await prisma.alat.count({ where })

    // Get equipment
    const alat = await prisma.alat.findMany({
      where,
      select: {
        id_alat: true,
        nama_alat: true,
        kode_alat: true,
        stok: true,
        kondisi: true,
        gambar: true,
        spesifikasi: true,
        harga: true,
        created_at: true,
        kategori: {
          select: {
            id_kategori: true,
            nama_kategori: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    })

    return formatPaginatedResponse(alat, page, limit, total)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get alat error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
