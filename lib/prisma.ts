import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  adminPrisma: PrismaClient | undefined
}

// Configure connection pool for Supabase + Vercel
const connectionPoolConfig = {
  connect_timeout: 20,
  pool_timeout: 20,
  idle_in_transaction_session_timeout: 10
}

// Build connection URL with pool configuration
function buildConnectionUrl(baseUrl: string | undefined): string | undefined {
  if (!baseUrl) return undefined
  
  // Parse existing URL to preserve pgbouncer and connection_limit settings
  const url = new URL(baseUrl)
  
  // Add connection pool parameters
  Object.entries(connectionPoolConfig).forEach(([key, value]) => {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value.toString())
    }
  })
  
  return url.toString()
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: buildConnectionUrl(process.env.DATABASE_URL)
    }
  }
})

export const adminPrisma = globalForPrisma.adminPrisma ?? new PrismaClient({
  datasources: {
    db: {
      url: buildConnectionUrl(process.env.DIRECT_URL)
    }
  }
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.adminPrisma = adminPrisma
} 