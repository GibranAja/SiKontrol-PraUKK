/**
 * Authentication Middleware
 * JWT validation and RBAC enforcement
 */

import { H3Event, createError } from 'h3'
import { extractTokenFromHeader, verifyAccessToken, type JwtPayload } from '../utils/jwt'
import prisma from '../utils/prisma'

// Extend event context type
declare module 'h3' {
  interface H3EventContext {
    user?: JwtPayload & { nama_lengkap: string }
  }
}

// ========== PUBLIC ROUTES ==========

const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
]

// ========== RBAC CONFIGURATION ==========

interface RoutePermission {
  pattern: RegExp
  methods: string[]
  roles: string[]
}

const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Users management - Admin only
  { pattern: /^\/api\/users$/, methods: ['POST'], roles: ['ADMIN'] },
  { pattern: /^\/api\/users\/\d+\/status$/, methods: ['PATCH'], roles: ['ADMIN'] },
  { pattern: /^\/api\/users\/\d+$/, methods: ['DELETE'], roles: ['ADMIN'] },

  // Kategori - Admin only for mutations
  { pattern: /^\/api\/kategori$/, methods: ['POST'], roles: ['ADMIN'] },
  { pattern: /^\/api\/kategori\/\d+$/, methods: ['PUT', 'DELETE'], roles: ['ADMIN'] },

  // Alat - Admin only for mutations (except kondisi which also allows PETUGAS)
  { pattern: /^\/api\/alat$/, methods: ['POST'], roles: ['ADMIN'] },
  { pattern: /^\/api\/alat\/\d+$/, methods: ['PUT', 'DELETE'], roles: ['ADMIN'] },
  { pattern: /^\/api\/alat\/\d+\/stok$/, methods: ['PATCH'], roles: ['ADMIN'] },
  { pattern: /^\/api\/alat\/\d+\/kondisi$/, methods: ['PATCH'], roles: ['ADMIN', 'PETUGAS'] },

  // Peminjaman - Different permissions
  { pattern: /^\/api\/peminjaman$/, methods: ['POST'], roles: ['PEMINJAM'] },
  { pattern: /^\/api\/peminjaman\/\d+\/verify$/, methods: ['POST'], roles: ['ADMIN', 'PETUGAS'] },
  { pattern: /^\/api\/peminjaman\/\d+\/cancel$/, methods: ['PATCH'], roles: ['PEMINJAM'] },

  // Perpanjangan
  { pattern: /^\/api\/perpanjangan$/, methods: ['POST'], roles: ['PEMINJAM'] },
  { pattern: /^\/api\/perpanjangan\/\d+\/verify$/, methods: ['POST'], roles: ['ADMIN', 'PETUGAS'] },

  // Pengembalian - Petugas/Admin only
  { pattern: /^\/api\/pengembalian$/, methods: ['POST'], roles: ['ADMIN', 'PETUGAS'] },
  { pattern: /^\/api\/pengembalian\/\d+\/bayar-denda$/, methods: ['PATCH'], roles: ['ADMIN', 'PETUGAS'] },

  // Laporan - Admin/Petugas only
  { pattern: /^\/api\/laporan/, methods: ['GET'], roles: ['ADMIN', 'PETUGAS'] },

  // Log Aktivitas - Admin only
  { pattern: /^\/api\/log-aktivitas/, methods: ['GET'], roles: ['ADMIN'] },
]

// ========== MIDDLEWARE HANDLER ==========

export default defineEventHandler(async (event: H3Event) => {
  const path = event.path
  const method = event.method

  // Skip non-API routes
  if (!path.startsWith('/api/')) {
    return
  }

  // Skip public routes
  if (PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '?'))) {
    return
  }

  // Extract and verify token
  const authHeader = getHeader(event, 'Authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token autentikasi tidak ditemukan',
        },
      },
    })
  }

  const payload = verifyAccessToken(token)

  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token tidak valid atau sudah kadaluarsa',
        },
      },
    })
  }

  // Check if user still exists and is active
  const user = await prisma.users.findUnique({
    where: { id_user: payload.id_user },
    select: {
      id_user: true,
      username: true,
      nama_lengkap: true,
      role: true,
      status_akun: true,
    },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User tidak ditemukan',
        },
      },
    })
  }

  if (user.status_akun !== 'AKTIF') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      data: {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Akun Anda sedang diblokir atau tidak aktif',
        },
      },
    })
  }

  // Attach user to context
  event.context.user = {
    id_user: user.id_user,
    username: user.username,
    nama_lengkap: user.nama_lengkap,
    role: user.role,
    status_akun: user.status_akun,
  }

  // Check RBAC permissions
  const matchedPermission = ROUTE_PERMISSIONS.find(
    perm => perm.pattern.test(path) && perm.methods.includes(method)
  )

  if (matchedPermission) {
    if (!matchedPermission.roles.includes(user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Anda tidak memiliki akses untuk melakukan tindakan ini',
          },
        },
      })
    }
  }
})
