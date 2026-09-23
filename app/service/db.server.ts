import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import type { PoolConfig } from 'pg'
import { PrismaClient } from '../../generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

/**
 * Managed Postgres (e.g. Scaleway RDB) uses a private CA.
 *
 * Important: do NOT leave `sslmode=…` on the connection string while also
 * passing `ssl`. `pg` does `Object.assign(config, parse(connectionString))`,
 * and `sslmode=require` sets `ssl: true`, which overwrites
 * `{ rejectUnauthorized: false }` and yields "self-signed certificate".
 */
function poolConfigFromUrl(connectionString: string): PoolConfig {
  try {
    const url = new URL(connectionString)
    const sslmode = url.searchParams.get('sslmode')
    url.searchParams.delete('sslmode')
    const cleaned = url.toString().replace(/\?$/, '')

    const config: PoolConfig = { connectionString: cleaned }
    if (sslmode && sslmode !== 'disable') {
      config.ssl = {
        rejectUnauthorized: sslmode === 'verify-full',
      }
    }
    return config
  } catch {
    return { connectionString }
  }
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
