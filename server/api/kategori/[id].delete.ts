/**
 * DELETE /api/kategori/:id
 * Delete category (Admin only)
 * Only if no equipment is linked
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { idParamSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat menghapus kategori'),
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

    // Check if exists
    const kategori = await prisma.kategori.findUnique({
      where: { id_kategori: id, deleted_at: null },
    })

    if (!kategori) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Kategori tidak ditemukan'),
      })
    }

    // Check for linked equipment
    const alatCount = await prisma.alat.count({
      where: {
        id_kategori: id,
        deleted_at: null,
      },
    })

    if (alatCount > 0) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          `Kategori masih memiliki ${alatCount} alat. Hapus atau pindahkan alat terlebih dahulu.`
        ),
      })
    }

    // Soft delete
    await prisma.kategori.update({
      where: { id_kategori: id },
      data: { deleted_at: new Date() },
    })

    // Log activity
    await logActivityFromEvent(
      event,
      AktivitasType.DELETE_KATEGORI,
      `Menghapus kategori: ${kategori.nama_kategori}`
    )

    return formatResponse(null, undefined, 'Kategori berhasil dihapus')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Delete kategori error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
