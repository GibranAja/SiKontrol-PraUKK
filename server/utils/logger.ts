/**
 * Logger Utility
 * Server-side logging with activity tracking
 */

import prisma from './prisma'
import { getClientIp } from './helpers'
import type { H3Event } from 'h3'

// ========== TYPES ==========

export interface LogEntry {
  userId: number
  aktivitas: string
  detail?: string
  ipAddress?: string
}

// ========== ACTIVITY LOGGING ==========

/**
 * Log user activity to database
 */
export async function logActivity(entry: LogEntry): Promise<void> {
  try {
    await prisma.logAktivitas.create({
      data: {
        id_user: entry.userId,
        aktivitas: entry.aktivitas,
        detail: entry.detail,
        ip_address: entry.ipAddress,
      },
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

/**
 * Log activity from H3 event context
 */
export async function logActivityFromEvent(
  event: H3Event,
  aktivitas: string,
  detail?: string
): Promise<void> {
  const user = event.context.user
  if (!user?.id_user) return

  await logActivity({
    userId: user.id_user,
    aktivitas,
    detail,
    ipAddress: getClientIp(event),
  })
}

// ========== CONSOLE LOGGING ==========

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString()
  const color = LOG_COLORS[level]
  const reset = LOG_COLORS.reset

  let formatted = `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`

  if (meta && Object.keys(meta).length > 0) {
    formatted += ` ${JSON.stringify(meta)}`
  }

  return formatted
}

/**
 * Console logger with colored output
 */
export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatMessage('debug', message, meta))
    }
  },

  info(message: string, meta?: Record<string, unknown>) {
    console.log(formatMessage('info', message, meta))
  },

  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(formatMessage('warn', message, meta))
  },

  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const errorMeta = error instanceof Error
      ? { ...meta, error: error.message, stack: error.stack }
      : { ...meta, error }
    console.error(formatMessage('error', message, errorMeta))
  },
}

// ========== REQUEST LOGGING ==========

/**
 * Log HTTP request (for middleware)
 */
export function logRequest(event: H3Event): void {
  const method = event.method
  const path = event.path
  const ip = getClientIp(event)

  logger.info(`${method} ${path}`, { ip })
}

/**
 * Log HTTP response (for middleware)
 */
export function logResponse(event: H3Event, statusCode: number, duration: number): void {
  const method = event.method
  const path = event.path

  const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

  logger[level](`${method} ${path} - ${statusCode}`, { duration: `${duration}ms` })
}
