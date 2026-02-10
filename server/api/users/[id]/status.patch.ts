/**
 * PATCH /api/users/:id/status
 * Update user account status (Admin only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { idParamSchema, updateUserStatusSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'
import { revokeAllUserTokens } from '~~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  try {
    const adminUser = event.context.user

    if (!adminUser || !['ADMIN', 'PETUGAS'].includes(adminUser.role)) {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin/petugas yang dapat mengubah status akun'),
      })
    }

    // Validate ID from path
    const pathParts = event.path.split('/')
    const idIndex = pathParts.findIndex(p => p === 'users') + 1
    const id = parseInt(pathParts[idIndex] || '0')

    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'ID tidak valid'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = updateUserStatusSchema.safeParse(body)

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

    const { status_akun, catatan } = validation.data

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

    // Prevent admin from blocking themselves
    if (adminUser.id_user === id && status_akun !== 'AKTIF') {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Tidak dapat memblokir akun sendiri'),
      })
    }

    // Update status
    const user = await prisma.users.update({
      where: { id_user: id },
      data: { status_akun },
      select: {
        id_user: true,
        username: true,
        nama_lengkap: true,
        role: true,
        status_akun: true,
      },
    })

    // If user is blocked, revoke all their tokens
    if (status_akun === 'DIBLOKIR') {
      await revokeAllUserTokens(id)
    }

    // Determine activity type
    const aktivitas = status_akun === 'DIBLOKIR'
      ? AktivitasType.BLOCK_USER
      : status_akun === 'AKTIF'
        ? AktivitasType.UNBLOCK_USER
        : AktivitasType.UPDATE_USER

    // Log activity
    await logActivityFromEvent(
      event,
      aktivitas,
      `Mengubah status akun ${user.username} menjadi ${status_akun}${catatan ? `. Catatan: ${catatan}` : ''}`
    )

    return formatResponse(user, undefined, `Status akun berhasil diubah menjadi ${status_akun}`)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Update user status error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
