/**
 * POST /api/alat
 * Create new equipment (Admin only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { createAlatSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse, generateKodeAlat } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat menambah alat'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = createAlatSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))

      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Data tidak valid', errors),
      })
    }

    const { id_kategori, nama_alat, kode_alat, stok, kondisi, gambar, spesifikasi, harga } = validation.data

    // Check if kategori exists
    const kategori = await prisma.kategori.findUnique({
      where: { id_kategori, deleted_at: null },
    })

    if (!kategori) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Kategori tidak ditemukan'),
      })
    }

    // Generate or validate kode_alat
    const finalKodeAlat = kode_alat || generateKodeAlat()

    // Check if kode_alat exists
    const existing = await prisma.alat.findUnique({
      where: { kode_alat: finalKodeAlat },
    })

    if (existing) {
      throw createError({
        statusCode: 409,
        data: formatErrorResponse('CONFLICT', 'Kode alat sudah ada'),
      })
    }

    // Create equipment
    const alat = await prisma.alat.create({
      data: {
        id_kategori,
        nama_alat,
        kode_alat: finalKodeAlat,
        stok,
        kondisi,
        gambar,
        spesifikasi,
        harga,
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

    // Log activity
    await logActivityFromEvent(
      event,
      AktivitasType.CREATE_ALAT,
      `Menambah alat baru: ${nama_alat} (${finalKodeAlat})`
    )

    return formatResponse(alat, undefined, 'Alat berhasil ditambahkan')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Create alat error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
