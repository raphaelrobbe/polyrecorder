import type { User as AppUser } from '~/common/user'
import { t } from '~/lib/i18n'
import { createOpaqueToken, hashToken } from './crypto.server'
import { prisma } from './db.server'
import { sendMail } from './email.server'
import { getAppUrl } from './env.server'
import { getSessionToken } from './session.server'

const MAGIC_LINK_TTL_MS = 30 * 60 * 1000 // 30 minutes
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const MAGIC_LINK_RATE_LIMIT = 5
const MAGIC_LINK_RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  // Practical check — full RFC not needed
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

/** Only same-origin relative paths (blocks open redirects). */
export function safeRedirectPath(
  raw: string | null | undefined,
  fallback = '/',
): string {
  if (!raw) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback
  if (raw.includes('\\') || raw.includes('\n') || raw.includes('\r')) {
    return fallback
  }
  return raw
}

export async function getUserFromRequest(
  request: Request,
): Promise<AppUser | null> {
  const raw = await getSessionToken(request)
  if (!raw) return null

  const tokenHash = hashToken(raw)
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, pseudo: true } } },
  })
  if (!session) return null
  if (session.revokedAt) return null
  if (session.expiresAt.getTime() <= Date.now()) return null

  return {
    id: session.user.id,
    email: session.user.email,
    pseudo: session.user.pseudo,
  }
}

export type RequestMagicLinkResult =
  | { ok: true; previewLink?: string }
  | { ok: false; reason: 'invalid_email' | 'rate_limited' | 'email_failed' }

/**
 * Creates the User on first request (upsert), then emails a one-time link.
 * Always returns the same success shape for unknown vs known emails
 * (after validation), to avoid account enumeration.
 * In non-production, also returns `previewLink` so the UI can complete
 * sign-up without relying on SMTP.
 */
export async function requestMagicLink(
  rawEmail: string,
): Promise<RequestMagicLinkResult> {
  const email = normalizeEmail(rawEmail)
  if (!isValidEmail(email)) {
    return { ok: false, reason: 'invalid_email' }
  }

  const since = new Date(Date.now() - MAGIC_LINK_RATE_WINDOW_MS)
  const recentCount = await prisma.magicLink.count({
    where: { email, createdAt: { gte: since } },
  })
  if (recentCount >= MAGIC_LINK_RATE_LIMIT) {
    return { ok: false, reason: 'rate_limited' }
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  })

  const rawToken = createOpaqueToken(32)
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS)

  await prisma.magicLink.create({
    data: {
      email,
      purpose: 'login',
      tokenHash,
      expiresAt,
      userId: user.id,
    },
  })

  const link = `${getAppUrl()}/auth/callback?token=${encodeURIComponent(rawToken)}`
  // Emails default to French until we persist a preferred locale on User.
  const locale = 'fr' as const
  const sent = await sendMail({
    to: email,
    subject: t('auth.email.subject', undefined, locale),
    text: t('auth.email.text', { link }, locale),
    html: t('auth.email.html', { link }, locale),
  })

  const isProd = process.env.NODE_ENV === 'production'
  if (!sent.ok && isProd) {
    return { ok: false, reason: 'email_failed' }
  }

  return {
    ok: true,
    previewLink: isProd ? undefined : link,
  }
}

export type ConsumeMagicLinkResult =
  | { ok: true; sessionToken: string; user: AppUser }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' }

export async function consumeMagicLink(
  rawToken: string | null,
): Promise<ConsumeMagicLinkResult> {
  if (!rawToken || rawToken.length < 32) {
    return { ok: false, reason: 'invalid' }
  }

  const tokenHash = hashToken(rawToken)
  const magic = await prisma.magicLink.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, pseudo: true } } },
  })

  if (!magic) return { ok: false, reason: 'invalid' }
  if (magic.usedAt) return { ok: false, reason: 'used' }
  if (magic.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: 'expired' }
  }

  if (magic.purpose === 'email_change') {
    if (!magic.userId || !magic.user) {
      return { ok: false, reason: 'invalid' }
    }

    const taken = await prisma.user.findFirst({
      where: {
        email: magic.email,
        NOT: { id: magic.userId },
      },
      select: { id: true },
    })
    if (taken) return { ok: false, reason: 'invalid' }

    const sessionToken = createOpaqueToken(32)
    const sessionHash = hashToken(sessionToken)
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id: magic.userId },
        data: { email: magic.email },
        select: { id: true, email: true, pseudo: true },
      }),
      prisma.magicLink.update({
        where: { id: magic.id },
        data: { usedAt: new Date() },
      }),
      prisma.session.create({
        data: {
          tokenHash: sessionHash,
          expiresAt,
          userId: magic.userId,
        },
      }),
    ])

    return {
      ok: true,
      sessionToken,
      user,
    }
  }

  let user = magic.user
  if (!user) {
    user = await prisma.user.upsert({
      where: { email: magic.email },
      create: { email: magic.email },
      update: {},
      select: { id: true, email: true, pseudo: true },
    })
  }

  const sessionToken = createOpaqueToken(32)
  const sessionHash = hashToken(sessionToken)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await prisma.$transaction([
    prisma.magicLink.update({
      where: { id: magic.id },
      data: { usedAt: new Date(), userId: user.id },
    }),
    prisma.session.create({
      data: {
        tokenHash: sessionHash,
        expiresAt,
        userId: user.id,
      },
    }),
  ])

  return {
    ok: true,
    sessionToken,
    user: { id: user.id, email: user.email, pseudo: user.pseudo },
  }
}

const PSEUDO_MIN_LEN = 3
const PSEUDO_MAX_LEN = 40

export function normalizePseudo(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

export type PseudoParseResult =
  | { ok: true; pseudo: string | null }
  | { ok: false; reason: 'too_short' | 'too_long' }

/** Empty clears the display name; otherwise require 3–40 characters. */
export function parsePseudoInput(raw: string): PseudoParseResult {
  const pseudo = normalizePseudo(raw)
  if (pseudo.length === 0) return { ok: true, pseudo: null }
  if (pseudo.length < PSEUDO_MIN_LEN) return { ok: false, reason: 'too_short' }
  if (pseudo.length > PSEUDO_MAX_LEN) return { ok: false, reason: 'too_long' }
  return { ok: true, pseudo }
}

/** Case-insensitive availability (excluding the current user when provided). */
export async function isPseudoAvailable(
  pseudo: string,
  exceptUserId?: string,
): Promise<boolean> {
  const existing = await prisma.user.findFirst({
    where: {
      pseudo: { equals: pseudo, mode: 'insensitive' },
      ...(exceptUserId ? { NOT: { id: exceptUserId } } : {}),
    },
    select: { id: true },
  })
  return existing == null
}

export type UpdatePseudoResult =
  | { ok: true; user: AppUser }
  | {
      ok: false
      reason:
        | 'unauthorized'
        | 'too_short'
        | 'too_long'
        | 'taken'
        | 'invalid_pseudo'
    }

/** Normalize and persist optional display name for the current session user. */
export async function updatePseudoForRequest(
  request: Request,
  rawPseudo: string,
): Promise<UpdatePseudoResult> {
  const current = await getUserFromRequest(request)
  if (!current) return { ok: false, reason: 'unauthorized' }

  const parsed = parsePseudoInput(rawPseudo)
  if (!parsed.ok) return { ok: false, reason: parsed.reason }

  if (parsed.pseudo != null) {
    const available = await isPseudoAvailable(parsed.pseudo, current.id)
    if (!available) return { ok: false, reason: 'taken' }
  }

  try {
    const user = await prisma.user.update({
      where: { id: current.id },
      data: { pseudo: parsed.pseudo },
      select: { id: true, email: true, pseudo: true },
    })
    return { ok: true, user }
  } catch (error) {
    // Race against the unique index on LOWER(pseudo).
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { ok: false, reason: 'taken' }
    }
    console.error('[auth] updatePseudo failed', error)
    return { ok: false, reason: 'invalid_pseudo' }
  }
}

export type UpdateProfileResult =
  | {
      ok: true
      user: AppUser
      emailChangePending: boolean
      previewLink?: string
    }
  | {
      ok: false
      reason:
        | 'unauthorized'
        | 'too_short'
        | 'too_long'
        | 'taken'
        | 'invalid_email'
        | 'email_taken'
        | 'rate_limited'
        | 'email_failed'
        | 'invalid_pseudo'
    }

/**
 * Update pseudo immediately; if email changed, send a confirmation link to the
 * new address (email is applied only after the link is opened).
 */
export async function updateProfileForRequest(
  request: Request,
  rawEmail: string,
  rawPseudo: string,
): Promise<UpdateProfileResult> {
  const current = await getUserFromRequest(request)
  if (!current) return { ok: false, reason: 'unauthorized' }

  const parsed = parsePseudoInput(rawPseudo)
  if (!parsed.ok) return { ok: false, reason: parsed.reason }

  if (parsed.pseudo != null) {
    const available = await isPseudoAvailable(parsed.pseudo, current.id)
    if (!available) return { ok: false, reason: 'taken' }
  }

  const email = normalizeEmail(rawEmail)
  if (!isValidEmail(email)) {
    return { ok: false, reason: 'invalid_email' }
  }

  const emailChanged = email !== current.email
  if (emailChanged) {
    const taken = await prisma.user.findFirst({
      where: { email, NOT: { id: current.id } },
      select: { id: true },
    })
    if (taken) return { ok: false, reason: 'email_taken' }

    const since = new Date(Date.now() - MAGIC_LINK_RATE_WINDOW_MS)
    const recentCount = await prisma.magicLink.count({
      where: {
        email,
        purpose: 'email_change',
        createdAt: { gte: since },
      },
    })
    if (recentCount >= MAGIC_LINK_RATE_LIMIT) {
      return { ok: false, reason: 'rate_limited' }
    }
  }

  let user: AppUser
  try {
    user = await prisma.user.update({
      where: { id: current.id },
      data: { pseudo: parsed.pseudo },
      select: { id: true, email: true, pseudo: true },
    })
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { ok: false, reason: 'taken' }
    }
    console.error('[auth] updateProfile failed', error)
    return { ok: false, reason: 'invalid_pseudo' }
  }

  if (!emailChanged) {
    return { ok: true, user, emailChangePending: false }
  }

  const rawToken = createOpaqueToken(32)
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS)

  await prisma.magicLink.create({
    data: {
      email,
      purpose: 'email_change',
      tokenHash,
      expiresAt,
      userId: current.id,
    },
  })

  const link = `${getAppUrl()}/auth/callback?token=${encodeURIComponent(rawToken)}&next=${encodeURIComponent('/compte')}`
  const locale = 'fr' as const
  const sent = await sendMail({
    to: email,
    subject: t('auth.emailChange.subject', undefined, locale),
    text: t('auth.emailChange.text', { link }, locale),
    html: t('auth.emailChange.html', { link }, locale),
  })

  const isProd = process.env.NODE_ENV === 'production'
  if (!sent.ok && isProd) {
    return { ok: false, reason: 'email_failed' }
  }

  return {
    ok: true,
    user,
    emailChangePending: true,
    previewLink: isProd ? undefined : link,
  }
}

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; reason: 'unauthorized' | 'delete_failed' }

/**
 * Permanently delete the current user and auth-related rows.
 *
 * Today: User (+ cascading Session / MagicLink), plus any MagicLink rows
 * still keyed only by email.
 *
 * Later (when cloud storage / shared projects exist): also delete all
 * user-owned domain rows and every related object in S3 — keep this
 * function as the single choke point for that cleanup.
 */
export async function deleteAccountForRequest(
  request: Request,
): Promise<DeleteAccountResult> {
  const current = await getUserFromRequest(request)
  if (!current) return { ok: false, reason: 'unauthorized' }

  try {
    await prisma.$transaction([
      prisma.magicLink.deleteMany({ where: { email: current.email } }),
      prisma.user.delete({ where: { id: current.id } }),
    ])
    return { ok: true }
  } catch (error) {
    console.error('[auth] deleteAccount failed', error)
    return { ok: false, reason: 'delete_failed' }
  }
}

export async function revokeSessionFromRequest(request: Request): Promise<void> {
  const raw = await getSessionToken(request)
  if (!raw) return
  const tokenHash = hashToken(raw)
  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
