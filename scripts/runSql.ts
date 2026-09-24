/**
 * Execute a .sql file against DATABASE_URL (from .env or the environment).
 *
 *   bun run runSql path/to/file.sql
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'
import type { PoolConfig, QueryResult } from 'pg'

function clientConfigFromUrl(connectionString: string): PoolConfig {
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

function printResult(result: QueryResult, index?: number) {
  const label =
    index == null ? 'result' : `result [${index + 1}]`
  if (result.rows?.length) {
    console.log(`\n── ${label}: ${result.rows.length} row(s) ──`)
    console.table(result.rows)
  } else {
    const n = result.rowCount ?? 0
    console.log(
      `\n── ${label}: ${result.command ?? 'OK'}${n > 0 ? ` (${n})` : ''} ──`,
    )
  }
}

const fileArg = process.argv[2]
if (!fileArg) {
  console.error('Usage: bun run runSql <file.sql>')
  process.exit(1)
}

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const sqlPath = resolve(fileArg)
const sql = readFileSync(sqlPath, 'utf8')
if (!sql.trim()) {
  console.error(`Empty SQL file: ${sqlPath}`)
  process.exit(1)
}

const host = (() => {
  try {
    return new URL(databaseUrl).host
  } catch {
    return '(unparsed)'
  }
})()

console.log(`Running ${sqlPath}`)
console.log(`→ ${host}`)

const client = new pg.Client(clientConfigFromUrl(databaseUrl))
await client.connect()
try {
  const result = await client.query(sql)
  if (Array.isArray(result)) {
    for (const [i, part] of result.entries()) printResult(part, i)
  } else {
    printResult(result)
  }
} finally {
  await client.end()
}
