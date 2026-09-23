import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import type { PoolConfig } from 'pg'
import { PrismaClient } from '../../generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

/**
 * Managed Postgres (e.g. Scaleway RDB) uses a private/self-signed CA.
 * `sslmode=require` encrypts the link, but node-pg still verifies the cert
 * unless we set `rejectUnauthorized: false` → "self-signed certificate".
 */
function poolConfigFromUrl(connectionString: string): PoolConfig {
  const config: PoolConfig = { connectionString }
  try {
    const sslmode = new URL(connectionString).searchParams.get('sslmode')
    if (sslmode && sslmode !== 'disable') {
      config.ssl = {
        rejectUnauthorized: sslmode === 'verify-full',
      }
    }
  } catch {
    // Malformed URL — let pg fail with its own error.
  }
  return config
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }
  const adapter = new PrismaPg(poolConfigFromUrl(connectionString))
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

/** Server-only Prisma client (Postgres via @prisma/adapter-pg). */
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
