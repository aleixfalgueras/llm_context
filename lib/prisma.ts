import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  adminPrisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

export const adminPrisma = globalForPrisma.adminPrisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  },
  log: ['warn', 'error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.adminPrisma = adminPrisma
} 