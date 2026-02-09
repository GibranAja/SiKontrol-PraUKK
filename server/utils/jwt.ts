/**
 * JWT Utility Functions
 * Token generation, verification, and rotation
 */

import jwt, { type SignOptions } from 'jsonwebtoken'
import prisma from './prisma'

// ========== TYPES ==========

export interface JwtPayload {
  id_user: number
  username: string
  role: string
  status_akun: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

// ========== CONFIG ==========

const getJwtConfig = () => {
  const config = useRuntimeConfig()
  return {
    accessSecret: config.jwtSecret || process.env.JWT_SECRET || 'default-secret-change-me',
    refreshSecret: config.jwtRefreshSecret || process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    accessExpiresSeconds: 15 * 60, // 15 minutes
    refreshExpiresSeconds: 7 * 24 * 60 * 60, // 7 days
  }
}

// ========== TOKEN GENERATION ==========

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: JwtPayload): string {
  const config = getJwtConfig()
  const options: SignOptions = {
    expiresIn: config.accessExpiresSeconds,
  }
  return jwt.sign(payload, config.accessSecret, options)
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: JwtPayload): string {
  const config = getJwtConfig()
  const options: SignOptions = {
    expiresIn: config.refreshExpiresSeconds,
  }
  return jwt.sign(payload, config.refreshSecret, options)
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: JwtPayload): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  }
}

// ========== TOKEN VERIFICATION ==========

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const config = getJwtConfig()
    const decoded = jwt.verify(token, config.accessSecret) as JwtPayload
    return decoded
  } catch {
    return null
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const config = getJwtConfig()
    const decoded = jwt.verify(token, config.refreshSecret) as JwtPayload
    return decoded
  } catch {
    return null
  }
}

// ========== TOKEN MANAGEMENT ==========

/**
 * Store refresh token in database
 */
export async function storeRefreshToken(userId: number, token: string): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  await prisma.refreshToken.create({
    data: {
      token,
      user_id: userId,
      expires_at: expiresAt,
    },
  })
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  })
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId: number): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { user_id: userId },
    data: { revoked: true },
  })
}

/**
 * Check if refresh token is valid (not revoked and not expired)
 */
export async function isRefreshTokenValid(token: string): Promise<boolean> {
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token },
  })

  if (!tokenRecord) return false
  if (tokenRecord.revoked) return false
  if (tokenRecord.expires_at < new Date()) return false

  return true
}

/**
 * Rotate refresh token (revoke old, generate new)
 */
export async function rotateRefreshToken(oldToken: string): Promise<TokenPair | null> {
  // Verify old token
  const payload = verifyRefreshToken(oldToken)
  if (!payload) return null

  // Check if token is valid in database
  const isValid = await isRefreshTokenValid(oldToken)
  if (!isValid) return null

  // Get fresh user data
  const user = await prisma.users.findUnique({
    where: { id_user: payload.id_user },
    select: {
      id_user: true,
      username: true,
      role: true,
      status_akun: true,
    },
  })

  if (!user || user.status_akun !== 'AKTIF') return null

  // Revoke old token
  await revokeRefreshToken(oldToken)

  // Generate new token pair
  const newPayload: JwtPayload = {
    id_user: user.id_user,
    username: user.username,
    role: user.role,
    status_akun: user.status_akun,
  }

  const tokens = generateTokenPair(newPayload)

  // Store new refresh token
  await storeRefreshToken(user.id_user, tokens.refreshToken)

  return tokens
}

/**
 * Cleanup expired tokens (to be called by scheduler)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expires_at: { lt: new Date() } },
        { revoked: true },
      ],
    },
  })

  return result.count
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null

  return parts[1] ?? null
}
