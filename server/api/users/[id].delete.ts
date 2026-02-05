/**
 * DELETE /api/users/:id
 * Soft delete user (Admin only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { idParamSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'
import { revokeAllUserTokens } from '~~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  try {
    const adminUser = event.context.user

    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat menghapus user'),
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

    // Prevent admin from deleting themselves
    if (adminUser.id_user === id) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Tidak dapat menghapus akun sendiri'),
      })
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id_user: id, deleted_at: null },
    })

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'User tidak ditemukan'),
      })
    }

    // Check for active loans
    const activePeminjaman = await prisma.peminjaman.count({
      where: {
        id_user: id,
        status_peminjaman: 'DIPINJAM',
      },
    })

    if (activePeminjaman > 0) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          `User masih memiliki ${activePeminjaman} peminjaman aktif. Selesaikan peminjaman terlebih dahulu.`
        ),
      })
    }

    // Check for unpaid fines
    const unpaidDenda = await prisma.pengembalian.aggregate({
      where: {
        peminjaman: { id_user: id },
        status_denda: 'BELUM_BAYAR',
      },
      _sum: { denda: true },
    })

    if (unpaidDenda._sum.denda && unpaidDenda._sum.denda > 0) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          `User masih memiliki denda yang belum dibayar sebesar Rp ${unpaidDenda._sum.denda.toLocaleString('id-ID')}`
        ),
      })
    }

    // Soft delete user
    await prisma.users.update({
      where: { id_user: id },
      data: { deleted_at: new Date() },
    })

    // Revoke all tokens
    await revokeAllUserTokens(id)

    // Log activity
    await logActivityFromEvent(
      event,
      AktivitasType.DELETE_USER,
      `Menghapus user: ${existingUser.username}`
    )

    return formatResponse(null, undefined, 'User berhasil dihapus')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Delete user error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
