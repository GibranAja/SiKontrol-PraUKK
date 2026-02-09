/**
 * Rate Limiting Middleware
 * Protects against brute force attacks
 */

import { H3Event, createError } from 'h3'
import { getClientIp } from '../utils/helpers'

// ========== IN-MEMORY STORE ==========
// Note: For production, use Redis or similar

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// ========== CONFIGURATION ==========

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register']

const RATE_LIMITS = {
  auth: {
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'),
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW || '900000'), // 15 minutes
  },
  api: {
    max: parseInt(process.env.RATE_LIMIT_API_MAX || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW || '60000'), // 1 minute
  },
}

// ========== MIDDLEWARE HANDLER ==========

export default defineEventHandler((event: H3Event) => {
  // Skip non-API routes
  if (!event.path.startsWith('/api/')) {
    return
  }

  const ip = getClientIp(event)
  const isAuthEndpoint = AUTH_ENDPOINTS.some(ep => event.path.startsWith(ep))
  const config = isAuthEndpoint ? RATE_LIMITS.auth : RATE_LIMITS.api

  const key = `${isAuthEndpoint ? 'auth' : 'api'}:${ip}`
  const now = Date.now()

  // Get or create entry
  let entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    }
  }

  entry.count++
  rateLimitStore.set(key, entry)

  // Set rate limit headers
  setHeader(event, 'X-RateLimit-Limit', config.max.toString())
  setHeader(event, 'X-RateLimit-Remaining', Math.max(0, config.max - entry.count).toString())
  setHeader(event, 'X-RateLimit-Reset', entry.resetAt.toString())

  // Check if limit exceeded
  if (entry.count > config.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    setHeader(event, 'Retry-After', retryAfter)

    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: isAuthEndpoint
            ? `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(retryAfter / 60)} menit.`
            : `Terlalu banyak request. Coba lagi dalam ${retryAfter} detik.`,
        },
      },
    })
  }
})

// ========== CLEANUP (called periodically) ==========

export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

// Auto cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
