/**
 * POST /api/users
 * Create new user (Admin only)
 */

import { createError } from 'h3'
import bcrypt from 'bcrypt'
import prisma from '~~/server/utils/prisma'
import { createUserSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const adminUser = event.context.user

    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Hanya admin yang dapat membuat user baru'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = createUserSchema.safeParse(body)

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

    const { username, password, nama_lengkap, role, kelas, jenis_kelamin, status_akun } = validation.data

    // Check if username exists
    const existingUser = await prisma.users.findUnique({
      where: { username },
    })

    if (existingUser) {
      throw createError({
        statusCode: 409,
        data: formatErrorResponse('CONFLICT', 'Username sudah terdaftar'),
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.users.create({
      data: {
        username,
        password: hashedPassword,
        nama_lengkap,
        role,
        kelas,
        jenis_kelamin,
        status_akun,
      },
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
      AktivitasType.CREATE_USER,
      `Membuat user baru: ${username} dengan role ${role}`
    )

    return formatResponse(user, undefined, 'User berhasil dibuat')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Create user error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
