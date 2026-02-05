/**
 * Prisma Client Singleton
 * Prevents multiple Prisma Client instances in development
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Extended Prisma client with soft delete functionality
 */
export const prismaExtended = prisma.$extends({
  query: {
    users: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deleted_at: null }
        return query(args)
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deleted_at: null }
        return query(args)
      },
      async findUnique({ args, query }) {
        return query(args)
      },
    },
    alat: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deleted_at: null }
        return query(args)
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deleted_at: null }
        return query(args)
      },
    },
    kategori: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deleted_at: null }
        return query(args)
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deleted_at: null }
        return query(args)
      },
    },
  },
})

export default prisma
