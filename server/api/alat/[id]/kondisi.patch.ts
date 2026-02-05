/**
 * PATCH /api/alat/:id/kondisi
 * Update equipment condition (Admin/Petugas)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { updateKondisiSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType, KondisiTypeDisplay } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || !['ADMIN', 'PETUGAS'].includes(user.role)) {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Tidak memiliki akses'),
      })
    }

    // Get ID from path
    const pathParts = event.path.split('/')
    const idIndex = pathParts.findIndex(p => p === 'alat') + 1
    const id = parseInt(pathParts[idIndex] || '0')

    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'ID tidak valid'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = updateKondisiSchema.safeParse(body)

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

    const { kondisi, catatan } = validation.data

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

    const oldKondisi = existing.kondisi

    // Update kondisi
    const alat = await prisma.alat.update({
      where: { id_alat: id },
      data: { kondisi },
      select: {
        id_alat: true,
        nama_alat: true,
        kode_alat: true,
        kondisi: true,
      },
    })

    // Log activity
    await logActivityFromEvent(
      event,
      AktivitasType.UPDATE_KONDISI_ALAT,
      `Mengubah kondisi ${alat.nama_alat} (${alat.kode_alat}) dari ${KondisiTypeDisplay[oldKondisi]} menjadi ${KondisiTypeDisplay[kondisi]}${catatan ? `. Catatan: ${catatan}` : ''}`
    )

    return formatResponse(alat, undefined, 'Kondisi alat berhasil diperbarui')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Update kondisi alat error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
