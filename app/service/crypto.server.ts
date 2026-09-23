import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** Cryptographically random opaque token (hex). */
export function createOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex')
}

/** SHA-256 hex digest — store this, never the raw token. */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex')
}

export function safeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex')
    const bufB = Buffer.from(b, 'hex')
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}
