/**
 * POST /api/auth/register
 * Register new PEMINJAM account
 */

import { createError } from 'h3'
import bcrypt from 'bcrypt'
import prisma from '~~/server/utils/prisma'
import { registerSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse, getClientIp } from '~~/server/utils/helpers'
import { logActivity } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate body
    const body = await readBody(event)
    const validation = registerSchema.safeParse(body)

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

    const { username, password, nama_lengkap, kelas, jenis_kelamin } = validation.data

    // Check if username already exists
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

    // Create user as PEMINJAM
    const user = await prisma.users.create({
      data: {
        username,
        password: hashedPassword,
        nama_lengkap,
        kelas,
        jenis_kelamin,
        role: 'PEMINJAM',
        status_akun: 'AKTIF',
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
    await logActivity({
      userId: user.id_user,
      aktivitas: AktivitasType.REGISTER,
      detail: `User ${username} melakukan registrasi`,
      ipAddress: getClientIp(event),
    })

    return formatResponse(user, undefined, 'Registrasi berhasil')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Register error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
