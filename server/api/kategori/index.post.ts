/**
 * POST /api/kategori
 * Create new category (Admin only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { createKategoriSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat membuat kategori'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = createKategoriSchema.safeParse(body)

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

    const { nama_kategori, deskripsi } = validation.data

    // Check if category name exists
    const existing = await prisma.kategori.findFirst({
      where: {
        nama_kategori,
        deleted_at: null,
      },
    })

    if (existing) {
      throw createError({
        statusCode: 409,
        data: formatErrorResponse('CONFLICT', 'Nama kategori sudah ada'),
      })
    }

    // Create category
    const kategori = await prisma.kategori.create({
      data: {
        nama_kategori,
        deskripsi,
      },
    })

    // Log activity
    await logActivityFromEvent(
      event,
      AktivitasType.CREATE_KATEGORI,
      `Membuat kategori baru: ${nama_kategori}`
    )

    return formatResponse(kategori, undefined, 'Kategori berhasil dibuat')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Create kategori error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
