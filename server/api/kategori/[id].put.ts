/**
 * PUT /api/kategori/:id
 * Update category (Admin only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { idParamSchema, updateKategoriSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat mengubah kategori'),
      })
    }

    // Validate ID
    const params = event.context.params
    const idValidation = idParamSchema.safeParse(params)

    if (!idValidation.success) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'ID tidak valid'),
      })
    }

    const { id } = idValidation.data

    // Parse and validate body
    const body = await readBody(event)
    const validation = updateKategoriSchema.safeParse(body)

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

    // Check if exists
    const existing = await prisma.kategori.findUnique({
      where: { id_kategori: id, deleted_at: null },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Kategori tidak ditemukan'),
      })
    }

    const { nama_kategori, deskripsi } = validation.data

    // Check duplicate name
    if (nama_kategori && nama_kategori !== existing.nama_kategori) {
      const duplicate = await prisma.kategori.findFirst({
        where: {
          nama_kategori,
          deleted_at: null,
          id_kategori: { not: id },
        },
      })

      if (duplicate) {
        throw createError({
          statusCode: 409,
          data: formatErrorResponse('CONFLICT', 'Nama kategori sudah ada'),
        })
      }
    }

    // Update
    const kategori = await prisma.kategori.update({
      where: { id_kategori: id },
      data: {
        ...(nama_kategori && { nama_kategori }),
        ...(deskripsi !== undefined && { deskripsi }),
      },
    })

    // Log activity
    await logActivityFromEvent(
      event,
      AktivitasType.UPDATE_KATEGORI,
      `Memperbarui kategori: ${kategori.nama_kategori}`
    )

    return formatResponse(kategori, undefined, 'Kategori berhasil diperbarui')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Update kategori error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
