import 'dotenv/config'

/** Server env helpers — no secret fallbacks in production. */

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

export function getAppUrl(): string {
  const url = process.env.APP_URL?.trim()
  if (url) return url.replace(/\/$/, '')
  if (process.env.NODE_ENV === 'production') {
    throw new Error('APP_URL is not set')
  }
  return 'http://localhost:5173'
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim()
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is not set')
  }
  console.warn(
    '[auth] SESSION_SECRET missing — using insecure dev default. Set it in .env.',
  )
  return 'dev-only-insecure-session-secret'
}

export function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim()
  const port = Number(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER?.trim()
  // TEM SMTP password is the Scaleway API secret — reuse SCW_SECRET_KEY when set.
  const pass =
    process.env.SMTP_PASS?.trim() || process.env.SCW_SECRET_KEY?.trim()
  const from = process.env.SMTP_FROM?.trim()
  if (!host || !user || !pass || !from) {
    return null
  }
  return { host, port, user, pass, from }
}
