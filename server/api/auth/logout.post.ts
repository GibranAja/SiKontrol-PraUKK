/**
 * POST /api/auth/logout
 * Invalidate refresh token and log activity
 */

import { createError } from 'h3'
import { formatResponse, formatErrorResponse, getClientIp } from '~~/server/utils/helpers'
import { revokeRefreshToken, extractTokenFromHeader, verifyRefreshToken } from '~~/server/utils/jwt'
import { logActivity } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        data: formatErrorResponse('UNAUTHORIZED', 'Tidak terautentikasi'),
      })
    }

    // Get refresh token from body (optional)
    const body = await readBody(event).catch(() => ({}))
    const refreshToken = body?.refreshToken

    // Revoke refresh token if provided
    if (refreshToken) {
      await revokeRefreshToken(refreshToken)
    }

    // Log activity
    await logActivity({
      userId: user.id_user,
      aktivitas: AktivitasType.LOGOUT,
      detail: `User ${user.username} logout dari sistem`,
      ipAddress: getClientIp(event),
    })

    return formatResponse(null, undefined, 'Logout berhasil')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Logout error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
