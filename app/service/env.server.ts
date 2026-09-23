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

/** Fixed sender — domain must be verified in Scaleway TEM. */
export const SMTP_FROM = 'PolyRecorder <noreply@polyrecorder.app>'

export function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim()
  const port = Number(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER?.trim()
  // TEM SMTP password is the Scaleway API secret — reuse SCW_SECRET_KEY when set.
  const pass =
    process.env.SMTP_PASS?.trim() || process.env.SCW_SECRET_KEY?.trim()
  if (!host || !user || !pass) {
    return null
  }
  return { host, port, user, pass, from: SMTP_FROM }
}

export type S3Config = {
  endpoint: string
  region: string
  bucket: string
  accessKey: string
  secretKey: string
}

export function getS3Config(): S3Config | null {
  const region = process.env.S3_REGION?.trim() || 'fr-par'
  const bucket = process.env.S3_BUCKET?.trim()
  const accessKey = process.env.S3_ACCESS_KEY?.trim()
  const secretKey = process.env.S3_SECRET_KEY?.trim()
  if (!bucket || !accessKey || !secretKey) {
    return null
  }

  // Always use the regional endpoint. A bucket virtual-host URL
  // (https://bucket.s3.region.scw.cloud) makes the SDK double the bucket name.
  let endpoint = process.env.S3_ENDPOINT?.trim()
  if (!endpoint || endpoint.includes(`${bucket}.s3.`)) {
    endpoint = `https://s3.${region}.scw.cloud`
  }
  endpoint = endpoint.replace(/\/$/, '')

  return { endpoint, region, bucket, accessKey, secretKey }
}

/**
 * First path segment of object keys (`dev` | `prod`, or custom via S3_KEY_PREFIX).
 * Lets localhost and production share one bucket without mixing objects.
 */
export function getS3KeyPrefix(): string {
  const explicit = process.env.S3_KEY_PREFIX?.trim()
  if (explicit) return explicit.replace(/^\/+|\/+$/g, '')
  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
}

/** Max upload size accepted by presign (100 MiB). */
export const CLOUD_UPLOAD_MAX_BYTES = 100 * 1024 * 1024

