/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */

import { createError } from 'h3'
import bcrypt from 'bcrypt'
import prisma from '~~/server/utils/prisma'
import { loginSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse, getClientIp } from '~~/server/utils/helpers'
import { generateTokenPair, storeRefreshToken } from '~~/server/utils/jwt'
import { logActivity } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate body
    const body = await readBody(event)
    const validation = loginSchema.safeParse(body)

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

    const { username, password } = validation.data

    // Find user
    const user = await prisma.users.findUnique({
      where: { username },
      select: {
        id_user: true,
        username: true,
        password: true,
        nama_lengkap: true,
        role: true,
        kelas: true,
        jenis_kelamin: true,
        status_akun: true,
        created_at: true,
      },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        data: formatErrorResponse('UNAUTHORIZED', 'Username atau password salah'),
      })
    }

    // Check account status
    if (user.status_akun === 'DIBLOKIR') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Akun Anda diblokir. Hubungi administrator.'),
      })
    }

    if (user.status_akun === 'NONAKTIF') {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Akun Anda tidak aktif.'),
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        data: formatErrorResponse('UNAUTHORIZED', 'Username atau password salah'),
      })
    }

    // Generate tokens
    const tokens = generateTokenPair({
      id_user: user.id_user,
      username: user.username,
      role: user.role,
      status_akun: user.status_akun,
    })

    // Store refresh token
    await storeRefreshToken(user.id_user, tokens.refreshToken)

    // Log activity
    await logActivity({
      userId: user.id_user,
      aktivitas: AktivitasType.LOGIN,
      detail: `User ${username} berhasil login`,
      ipAddress: getClientIp(event),
    })

    // Return user data without password
    const { password: _, ...userData } = user

    return formatResponse({
      user: userData,
      tokens,
    }, undefined, 'Login berhasil')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Login error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
