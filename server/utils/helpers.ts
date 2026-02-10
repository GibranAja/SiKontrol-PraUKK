/**
 * Server Helper Functions
 * Utility functions for business logic calculations and formatting
 */

import type { H3Event } from 'h3'
import { KondisiTypeDisplay, StatusPeminjamanDisplay, StatusPerpanjanganDisplay, StatusDendaDisplay, StatusAkunDisplay, RoleTypeDisplay } from './enums'

// ========== DENDA CALCULATION ==========

interface DendaConfig {
  dendaPerHari: number
  dendaRusakRingan: number
  dendaRusakBerat: number
}

const getDendaConfig = (): DendaConfig => {
  return {
    dendaPerHari: parseInt(process.env.DENDA_PER_HARI || '5000'),
    dendaRusakRingan: parseInt(process.env.DENDA_RUSAK_RINGAN || '20000'),
    dendaRusakBerat: parseInt(process.env.DENDA_RUSAK_BERAT || '50000'),
  }
}

/**
 * Calculate denda (fine) for a return
 * @param tanggalHarusKembali - Due date
 * @param tanggalActual - Actual return date
 * @param kondisi - Condition when returned
 * @param hargaAlat - Equipment price (for lost items)
 */
export function calculateDenda(
  tanggalHarusKembali: Date,
  tanggalActual: Date,
  kondisi: string,
  hargaAlat: number = 0,
  dendaRusakManual?: number
): { total: number; breakdown: { keterlambatan: number; kondisi: number } } {
  const config = getDendaConfig()

  // Calculate late days
  const diffTime = tanggalActual.getTime() - tanggalHarusKembali.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const lateDays = Math.max(0, diffDays)

  // Late fine
  const dendaKeterlambatan = lateDays * config.dendaPerHari

  // Condition fine
  let dendaKondisi = 0
  switch (kondisi) {
    case 'RUSAK_RINGAN':
    case 'RUSAK_BERAT':
      // Use manual input if provided, otherwise use default from config
      if (dendaRusakManual !== undefined && dendaRusakManual !== null) {
        dendaKondisi = dendaRusakManual
      } else {
        dendaKondisi = kondisi === 'RUSAK_RINGAN' ? config.dendaRusakRingan : config.dendaRusakBerat
      }
      break
    case 'HILANG':
      dendaKondisi = hargaAlat
      break
  }

  return {
    total: dendaKeterlambatan + dendaKondisi,
    breakdown: {
      keterlambatan: dendaKeterlambatan,
      kondisi: dendaKondisi,
    },
  }
}

/**
 * Check if extension can be requested (within 3 days of due date)
 */
export function canRequestPerpanjangan(tanggalHarusKembali: Date): boolean {
  const hariSebelumJatuhTempo = parseInt(process.env.HARI_SEBELUM_JATUH_TEMPO_PERPANJANGAN || '3')
  const now = new Date()
  const diffTime = tanggalHarusKembali.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays <= hariSebelumJatuhTempo && diffDays >= 0
}

/**
 * Calculate new due date after extension approval
 */
export function calculateNewDueDate(currentDueDate: Date, durasiTambahanHari: number): Date {
  const newDate = new Date(currentDueDate)
  newDate.setDate(newDate.getDate() + durasiTambahanHari)
  return newDate
}

// ========== CODE GENERATION ==========

/**
 * Generate unique peminjaman code
 * Format: PJM-YYYYMMDD-XXXXX
 */
export function generateKodePeminjaman(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `PJM-${dateStr}-${randomStr}`
}

/**
 * Generate unique kode alat
 * Format: ALT-XXX-XXXXX
 */
export function generateKodeAlat(prefix: string = 'ALT'): string {
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `${prefix}-${randomStr}`
}

// ========== RESPONSE FORMATTING ==========

interface ResponseMeta {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
}

interface SuccessResponse<T> {
  success: true
  data: T
  meta?: ResponseMeta
  message?: string
}

interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Array<{ field: string; message: string }>
  }
}

/**
 * Format successful response
 */
export function formatResponse<T>(
  data: T,
  meta?: ResponseMeta,
  message?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
    ...(message && { message }),
  }
}

/**
 * Format paginated response
 */
export function formatPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): SuccessResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Format error response
 */
export function formatErrorResponse(
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  }
}

// ========== DATE HELPERS ==========

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Check if date is overdue
 */
export function isOverdue(tanggalHarusKembali: Date): boolean {
  return new Date() > tanggalHarusKembali
}

/**
 * Get days until due date (negative if overdue)
 */
export function getDaysUntilDue(tanggalHarusKembali: Date): number {
  const now = new Date()
  const diffTime = tanggalHarusKembali.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Get days overdue (0 if not overdue)
 */
export function getDaysOverdue(tanggalHarusKembali: Date): number {
  const daysUntil = getDaysUntilDue(tanggalHarusKembali)
  return daysUntil < 0 ? Math.abs(daysUntil) : 0
}

// ========== INPUT SANITIZATION ==========

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m] || m)
}

/**
 * Sanitize and trim string input
 */
export function sanitizeString(input: string): string {
  return escapeHtml(input.trim())
}

// ========== IP ADDRESS ==========

/**
 * Get client IP address from request
 */
export function getClientIp(event: H3Event): string {
  const xForwardedFor = getHeader(event, 'x-forwarded-for')
  if (xForwardedFor) {
    const parts = xForwardedFor.split(',')
    return parts[0]?.trim() || 'unknown'
  }

  const xRealIp = getHeader(event, 'x-real-ip')
  if (xRealIp) {
    return xRealIp
  }

  return event.node.req.socket.remoteAddress || 'unknown'
}

// ========== DISPLAY HELPERS ==========

/**
 * Get display text for enum values
 */
export function getEnumDisplay(type: string, value: string): string {
  const displayMaps: Record<string, Record<string, string>> = {
    kondisi: KondisiTypeDisplay,
    statusPeminjaman: StatusPeminjamanDisplay,
    statusPerpanjangan: StatusPerpanjanganDisplay,
    statusDenda: StatusDendaDisplay,
    statusAkun: StatusAkunDisplay,
    role: RoleTypeDisplay,
  }

  return displayMaps[type]?.[value] || value
}

/**
 * Format currency to Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * Format datetime to Indonesian locale
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// ========== BUSINESS RULE HELPERS ==========

/**
 * Get max simultaneous loans allowed
 */
export function getMaxPeminjamanSimultan(): number {
  return parseInt(process.env.MAX_PEMINJAMAN_SIMULTAN || '2')
}

/**
 * Get max extension days allowed
 */
export function getMaxPerpanjanganHari(): number {
  return parseInt(process.env.MAX_PERPANJANGAN_HARI || '7')
}

/**
 * Get default loan duration in days
 */
export function getDefaultDurasiPinjam(): number {
  return parseInt(process.env.DEFAULT_DURASI_PINJAM_HARI || '7')
}

/**
 * Get auto-blacklist threshold days
 */
export function getBlacklistThresholdDays(): number {
  return parseInt(process.env.HARI_BLACKLIST_OTOMATIS || '14')
}
