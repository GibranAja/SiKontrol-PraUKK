/**
 * PATCH /api/alat/:id/stok
 * Update equipment stock (Admin only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { updateStokSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat mengubah stok'),
      })
    }

    // Get ID from path
    const pathParts = event.path.split('/')
    const idIndex = pathParts.findIndex(p => p === 'alat') + 1
    const id = parseInt(pathParts[idIndex])

    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'ID tidak valid'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = updateStokSchema.safeParse(body)

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

    const { stok, catatan } = validation.data

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

    const oldStok = existing.stok

    // Update stok
    const alat = await prisma.alat.update({
      where: { id_alat: id },
      data: { stok },
      select: {
        id_alat: true,
        nama_alat: true,
        kode_alat: true,
        stok: true,
      },
    })

    // Log activity
    await logActivityFromEvent(
      event,
      AktivitasType.UPDATE_STOK_ALAT,
      `Mengubah stok ${alat.nama_alat} (${alat.kode_alat}) dari ${oldStok} menjadi ${stok}${catatan ? `. Catatan: ${catatan}` : ''}`
    )

    return formatResponse(alat, undefined, 'Stok alat berhasil diperbarui')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Update stok alat error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
