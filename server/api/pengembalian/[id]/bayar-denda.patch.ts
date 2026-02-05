/**
 * PATCH /api/pengembalian/:id/bayar-denda
 * Update fine payment status (Admin/Petugas only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { updateDendaSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse, formatRupiah } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType, StatusDendaDisplay } from '~~/server/utils/enums'

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
    const idIndex = pathParts.findIndex(p => p === 'pengembalian') + 1
    const id = parseInt(pathParts[idIndex] || '0')

    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'ID tidak valid'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = updateDendaSchema.safeParse(body)

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

    const { status_denda, alasan_waive } = validation.data

    // Get pengembalian
    const pengembalian = await prisma.pengembalian.findUnique({
      where: { id_pengembalian: id },
      include: {
        peminjaman: {
          select: {
            kode_peminjaman: true,
            user: {
              select: {
                nama_lengkap: true,
              },
            },
          },
        },
      },
    })

    if (!pengembalian) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Pengembalian tidak ditemukan'),
      })
    }

    // Check if there's a fine to pay
    if (pengembalian.denda === 0) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Tidak ada denda untuk dibayarkan'),
      })
    }

    // Check current status
    if (pengembalian.status_denda === 'LUNAS') {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Denda sudah lunas'),
      })
    }

    // Validate waive reason
    if (status_denda === 'WAIVED' && !alasan_waive) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Alasan pembebasan denda wajib diisi'),
      })
    }

    // Only admin can waive fines
    if (status_denda === 'WAIVED' && user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat membebaskan denda'),
      })
    }

    // Update fine status
    const updatedPengembalian = await prisma.pengembalian.update({
      where: { id_pengembalian: id },
      data: {
        status_denda,
        catatan_pengembalian: status_denda === 'WAIVED'
          ? `${pengembalian.catatan_pengembalian || ''}\nDenda dibebaskan: ${alasan_waive}`.trim()
          : pengembalian.catatan_pengembalian,
      },
    })

    // Determine activity type
    const aktivitas = status_denda === 'WAIVED' ? AktivitasType.WAIVE_DENDA : AktivitasType.BAYAR_DENDA

    // Log activity
    let logDetail = `Mengubah status denda ${pengembalian.peminjaman.kode_peminjaman} menjadi ${StatusDendaDisplay[status_denda]}. Jumlah: ${formatRupiah(pengembalian.denda)}`
    if (status_denda === 'WAIVED') {
      logDetail += `. Alasan: ${alasan_waive}`
    }

    await logActivityFromEvent(event, aktivitas, logDetail)

    return formatResponse(updatedPengembalian, undefined, `Status denda berhasil diubah menjadi ${StatusDendaDisplay[status_denda]}`)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Update denda error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
