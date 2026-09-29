/**
 * Cloudflare Turnstile server verify.
 * When keys are unset in non-production, verification is skipped (like SMTP dump).
 */

export function getTurnstileSiteKey(): string | null {
  return process.env.TURNSTILE_SITE_KEY?.trim() || null
}

function getTurnstileSecretKey(): string | null {
  return process.env.TURNSTILE_SECRET_KEY?.trim() || null
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string | null,
): Promise<{ ok: true } | { ok: false; reason: 'missing' | 'invalid' }> {
  const secret = getTurnstileSecretKey()
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[turnstile] TURNSTILE_SECRET_KEY is not set')
      return { ok: false, reason: 'missing' }
    }
    console.info('[turnstile:dev] secret unset — skipping captcha verify')
    return { ok: true }
  }

  const trimmed = token.trim()
  if (!trimmed) return { ok: false, reason: 'invalid' }

  try {
    const body = new URLSearchParams()
    body.set('secret', secret)
    body.set('response', trimmed)
    if (remoteIp) body.set('remoteip', remoteIp)

    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    )
    const data = (await res.json()) as { success?: boolean }
    if (!data.success) return { ok: false, reason: 'invalid' }
    return { ok: true }
  } catch (error) {
    console.error('[turnstile] verify failed', error)
    return { ok: false, reason: 'invalid' }
  }
}
