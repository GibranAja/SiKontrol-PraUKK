/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */

import { createError } from 'h3'
import { refreshTokenSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { rotateRefreshToken } from '~~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate body
    const body = await readBody(event)
    const validation = refreshTokenSchema.safeParse(body)

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

    const { refreshToken } = validation.data

    // Rotate token (validates and generates new pair)
    const newTokens = await rotateRefreshToken(refreshToken)

    if (!newTokens) {
      throw createError({
        statusCode: 401,
        data: formatErrorResponse('UNAUTHORIZED', 'Refresh token tidak valid atau sudah kadaluarsa'),
      })
    }

    return formatResponse({
      tokens: newTokens,
    }, undefined, 'Token berhasil diperbarui')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Refresh token error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
