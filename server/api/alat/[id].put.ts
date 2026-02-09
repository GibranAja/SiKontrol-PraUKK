/**
 * PUT /api/alat/:id
 * Update equipment (Admin only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { idParamSchema, updateAlatSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat mengubah alat'),
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
    const validation = updateAlatSchema.safeParse(body)

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
    const existing = await prisma.alat.findUnique({
      where: { id_alat: id, deleted_at: null },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Alat tidak ditemukan'),
      })
    }

    const { id_kategori, nama_alat, kode_alat, stok, kondisi, gambar, spesifikasi, harga } = validation.data

    // Check if new kategori exists
    if (id_kategori) {
      const kategori = await prisma.kategori.findUnique({
        where: { id_kategori, deleted_at: null },
      })

      if (!kategori) {
        throw createError({
          statusCode: 404,
          data: formatErrorResponse('NOT_FOUND', 'Kategori tidak ditemukan'),
        })
      }
    }

    // Update
    const alat = await prisma.alat.update({
      where: { id_alat: id },
      data: {
        ...(id_kategori !== undefined && { id_kategori }),
        ...(nama_alat !== undefined && { nama_alat }),
        ...(kode_alat !== undefined && { kode_alat }),
        ...(stok !== undefined && { stok }),
        ...(kondisi !== undefined && { kondisi }),
        ...(gambar !== undefined && { gambar }),
        ...(spesifikasi !== undefined && { spesifikasi }),
        ...(harga !== undefined && { harga }),
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
      AktivitasType.UPDATE_ALAT,
      `Memperbarui alat: ${alat.nama_alat} (${alat.kode_alat})`
    )

    return formatResponse(alat, undefined, 'Alat berhasil diperbarui')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Update alat error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
