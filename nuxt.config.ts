// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@pinia/nuxt'],

  // HAPUS app.head - biarkan @nuxt/ui yang handle

  // Runtime Config
  runtimeConfig: {
    // Private keys (server-side only)
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),

    // Rate limiting
    rateLimitAuth: parseInt(process.env.RATE_LIMIT_AUTH || '5'),
    rateLimitAuthWindow: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW || '900000'),
    rateLimitApi: parseInt(process.env.RATE_LIMIT_API || '100'),
    rateLimitApiWindow: parseInt(process.env.RATE_LIMIT_API_WINDOW || '60000'),

    // Business rules
    dendaPerHari: parseInt(process.env.DENDA_PER_HARI || '5000'),
    dendaRusak: parseInt(process.env.DENDA_RUSAK || '50000'),
    dendaHilang: parseInt(process.env.DENDA_HILANG || '100000'),
    maksimalPeminjamanAktif: parseInt(process.env.MAKSIMAL_PEMINJAMAN_AKTIF || '2'),
    blacklistOverdueDays: parseInt(process.env.BLACKLIST_OVERDUE_DAYS || '14'),
    perpanjanganBatasDays: parseInt(process.env.PERPANJANGAN_BATAS_DAYS || '3'),
    perpanjanganMaksDays: parseInt(process.env.PERPANJANGAN_MAKS_DAYS || '7'),

    // Upload config
    uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880'),
    uploadDir: process.env.UPLOAD_DIR || './public/uploads',

    // Public keys (exposed to client)
    public: {
      appName: 'Sistem Peminjaman Alat',
      appVersion: '1.0.0',
    },
  },

  // Nitro Configuration
  nitro: {
    experimental: {
      tasks: true,
      openAPI: true,
    },

    routeRules: {
      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    },

    storage: {
      uploads: {
        driver: 'fs',
        base: './public/uploads',
      },
    },
  },
})
