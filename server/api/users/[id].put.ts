/**
 * PUT /api/users/:id
 * Update user profile
 */

import { createError } from 'h3'
import bcrypt from 'bcrypt'
import prisma from '~~/server/utils/prisma'
import { idParamSchema, updateUserSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const currentUser = event.context.user

    if (!currentUser) {
      throw createError({
        statusCode: 401,
        data: formatErrorResponse('UNAUTHORIZED', 'Tidak terautentikasi'),
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

    // Check permission - users can update themselves, admin can update anyone
    if (currentUser.role !== 'ADMIN' && currentUser.id_user !== id) {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Tidak memiliki akses untuk mengubah user ini'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = updateUserSchema.safeParse(body)

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

    // Build update data
    const updateData: any = {}
    const { nama_lengkap, kelas, jenis_kelamin, password } = validation.data

    if (nama_lengkap) updateData.nama_lengkap = nama_lengkap
    if (kelas) updateData.kelas = kelas
    if (jenis_kelamin) updateData.jenis_kelamin = jenis_kelamin
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const user = await prisma.users.update({
      where: { id_user: id },
      data: updateData,
      select: {
        id_user: true,
        username: true,
        nama_lengkap: true,
        role: true,
        kelas: true,
        jenis_kelamin: true,
        status_akun: true,
        created_at: true,
      },
    })

    // Log activity
    await logActivityFromEvent(
      event,
      AktivitasType.UPDATE_USER,
      `Memperbarui data user: ${user.username}`
    )

    return formatResponse(user, undefined, 'User berhasil diperbarui')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Update user error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
