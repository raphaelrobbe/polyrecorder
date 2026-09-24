import type { User as AppUser } from '~/common/user'
import { t } from '~/lib/i18n'
import { createOpaqueToken, hashToken } from './crypto.server'
import { prisma } from './db.server'
import { sendMail } from './email.server'
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

const USER_SELECT = {
  id: true,
  email: true,
  pseudo: true,
  pseudoCustomizedAt: true,
} as const

function toAppUser(user: {
  id: string
  email: string
  pseudo: string
  pseudoCustomizedAt: Date | null
}): AppUser {
  return {
    id: user.id,
    email: user.email,
    pseudo: user.pseudo,
    pseudoCustomizedAt: user.pseudoCustomizedAt?.toISOString() ?? null,
  }
}

const PSEUDO_MIN_LEN = 3
const PSEUDO_MAX_LEN = 40

export function normalizePseudo(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

export type PseudoParseResult =
  | { ok: true; pseudo: string }
  | { ok: false; reason: 'too_short' | 'too_long' | 'invalid_chars' }

/** Require 3–40 characters; `@` is reserved (email login / @handle display). */
export function parsePseudoInput(raw: string): PseudoParseResult {
  const pseudo = normalizePseudo(raw)
  if (pseudo.includes('@')) return { ok: false, reason: 'invalid_chars' }
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

/** Unique default pseudo from the email local-part (no `@`). */
export async function allocateDefaultPseudo(email: string): Promise<string> {
  const local = email.split('@')[0] ?? 'user'
  let base = normalizePseudo(local.replace(/@/g, ''))
  if (base.length < PSEUDO_MIN_LEN) base = 'user'
  if (base.length > PSEUDO_MAX_LEN) base = base.slice(0, PSEUDO_MAX_LEN)

  for (let n = 0; n < 500; n += 1) {
    const suffix = n === 0 ? '' : String(n + 1)
    const maxBase = PSEUDO_MAX_LEN - suffix.length
    const candidate =
      suffix.length === 0 ? base : `${base.slice(0, Math.max(1, maxBase))}${suffix}`
    if (await isPseudoAvailable(candidate)) return candidate
  }

  return `user${Date.now().toString(36)}`.slice(0, PSEUDO_MAX_LEN)
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
    include: { user: { select: USER_SELECT } },
  })
  if (!session) return null
  if (session.revokedAt) return null
  if (session.expiresAt.getTime() <= Date.now()) return null

  return toAppUser(session.user)
}

export type MagicLinkFailureReason =
  | 'invalid_email'
  | 'rate_limited'
  | 'email_failed'
  | 'smtp_not_configured'
  | 'send_failed'
  | 'app_url_missing'
  | 'db_failed'

export type RequestMagicLinkResult =
  | { ok: true; previewLink?: string }
  | { ok: false; reason: MagicLinkFailureReason; detail?: string }

function failureFromUnknown(error: unknown): {
  reason: MagicLinkFailureReason
  detail: string
} {
  const detail =
    error instanceof Error
      ? `${error.name}: ${error.message}`.slice(0, 240)
      : String(error).slice(0, 240)
  const code =
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : ''
  const looksLikeDb =
    code.startsWith('P') ||
    /prisma|database|postgres|ECONNREFUSED|ENOTFOUND|DATABASE_URL/i.test(
      detail,
    )
  return { reason: looksLikeDb ? 'db_failed' : 'email_failed', detail }
}

/**
 * Creates the User on first email request, then emails a one-time link.
 * Accepts an e-mail or a pseudo (leading @ stripped). HTTP response shape is
 * identical for unknown identifiers (no enumeration). Welcome copy + next=/compte
 * for brand-new accounts only.
 */
export async function requestMagicLink(
  rawIdentifier: string,
): Promise<RequestMagicLinkResult> {
  try {
    const resolved = await resolveLoginIdentifier(rawIdentifier)
    if (!resolved.ok) {
      return { ok: false, reason: 'invalid_email' }
    }

    const { email, isNewAccount } = resolved

    const since = new Date(Date.now() - MAGIC_LINK_RATE_WINDOW_MS)
    const recentCount = await prisma.magicLink.count({
      where: { email, createdAt: { gte: since } },
    })
    if (recentCount >= MAGIC_LINK_RATE_LIMIT) {
      return { ok: false, reason: 'rate_limited' }
    }

    // Unknown pseudo: pretend success (no email, no user creation).
    if (resolved.kind === 'pseudo_unknown') {
      return { ok: true }
    }

    let userId = resolved.userId
    if (!userId) {
      const pseudo = await allocateDefaultPseudo(email)
      const user = await prisma.user.create({
        data: { email, pseudo },
        select: { id: true },
      })
      userId = user.id
    }

    const rawToken = createOpaqueToken(32)
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS)

    await prisma.magicLink.create({
      data: {
        email,
        purpose: 'login',
        tokenHash,
        expiresAt,
        userId,
      },
    })

    const appUrl = process.env.APP_URL?.trim()?.replace(/\/$/, '')
    if (!appUrl) {
      console.error('[auth] APP_URL is not set — cannot build magic link')
      return { ok: false, reason: 'app_url_missing' }
    }

    const tokenParam = `token=${encodeURIComponent(rawToken)}`
    const link = isNewAccount
      ? `${appUrl}/auth/callback?${tokenParam}&next=${encodeURIComponent('/compte')}`
      : `${appUrl}/auth/callback?${tokenParam}`
    // Emails default to French until we persist a preferred locale on User.
    const locale = 'fr' as const
    const keys = isNewAccount
      ? {
          subject: 'auth.email.welcome.subject' as const,
          text: 'auth.email.welcome.text' as const,
          html: 'auth.email.welcome.html' as const,
        }
      : {
          subject: 'auth.email.signIn.subject' as const,
          text: 'auth.email.signIn.text' as const,
          html: 'auth.email.signIn.html' as const,
        }
    const sent = await sendMail({
      to: email,
      subject: t(keys.subject, undefined, locale),
      text: t(keys.text, { link }, locale),
      html: t(keys.html, { link }, locale),
    })

    const isProd = process.env.NODE_ENV === 'production'
    if (!sent.ok && isProd) {
      const reason: MagicLinkFailureReason =
        sent.reason === 'smtp_not_configured' || sent.reason === 'send_failed'
          ? sent.reason
          : 'email_failed'
      console.error('[auth] magic link email failed', {
        reason,
        detail: sent.detail ?? sent.reason,
        email,
      })
      return {
        ok: false,
        reason,
        detail: sent.detail ?? sent.reason,
      }
    }

    return {
      ok: true,
      previewLink: isProd ? undefined : link,
    }
  } catch (error) {
    const failure = failureFromUnknown(error)
    console.error('[auth] requestMagicLink failed', failure, error)
    return { ok: false, ...failure }
  }
}

type ResolvedLogin =
  | {
      ok: true
      kind: 'email'
      email: string
      userId: string | null
      isNewAccount: boolean
    }
  | {
      ok: true
      kind: 'pseudo'
      email: string
      userId: string
      isNewAccount: false
    }
  | { ok: true; kind: 'pseudo_unknown'; email: string; userId: null; isNewAccount: false }
  | { ok: false }

/**
 * E-mail if the identifier still contains `@` after stripping one leading `@`;
 * otherwise treat as pseudo.
 */
async function resolveLoginIdentifier(raw: string): Promise<ResolvedLogin> {
  let value = raw.trim()
  if (value.startsWith('@')) value = value.slice(1).trim()

  if (value.includes('@')) {
    const email = normalizeEmail(value)
    if (!isValidEmail(email)) return { ok: false }
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    return {
      ok: true,
      kind: 'email',
      email,
      userId: existing?.id ?? null,
      isNewAccount: existing == null,
    }
  }

  const pseudo = normalizePseudo(value)
  if (pseudo.length < PSEUDO_MIN_LEN) return { ok: false }

  const existing = await prisma.user.findFirst({
    where: { pseudo: { equals: pseudo, mode: 'insensitive' } },
    select: { id: true, email: true },
  })
  if (!existing) {
    return {
      ok: true,
      kind: 'pseudo_unknown',
      email: '',
      userId: null,
      isNewAccount: false,
    }
  }
  return {
    ok: true,
    kind: 'pseudo',
    email: existing.email,
    userId: existing.id,
    isNewAccount: false,
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
    include: { user: { select: USER_SELECT } },
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
        select: USER_SELECT,
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
      user: toAppUser(user),
    }
  }

  let user = magic.user
  if (!user) {
    const pseudo = await allocateDefaultPseudo(magic.email)
    user = await prisma.user.upsert({
      where: { email: magic.email },
      create: { email: magic.email, pseudo },
      update: {},
      select: USER_SELECT,
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
    user: toAppUser(user),
  }
}

export type UpdatePseudoResult =
  | { ok: true; user: AppUser }
  | {
      ok: false
      reason:
        | 'unauthorized'
        | 'too_short'
        | 'too_long'
        | 'invalid_chars'
        | 'taken'
        | 'invalid_pseudo'
    }

/** Persist required display name for the current session user. */
export async function updatePseudoForRequest(
  request: Request,
  rawPseudo: string,
): Promise<UpdatePseudoResult> {
  const current = await getUserFromRequest(request)
  if (!current) return { ok: false, reason: 'unauthorized' }

  const parsed = parsePseudoInput(rawPseudo)
  if (!parsed.ok) return { ok: false, reason: parsed.reason }

  const available = await isPseudoAvailable(parsed.pseudo, current.id)
  if (!available) return { ok: false, reason: 'taken' }

  try {
    const user = await prisma.user.update({
      where: { id: current.id },
      data: {
        pseudo: parsed.pseudo,
        ...(current.pseudoCustomizedAt == null &&
        parsed.pseudo.toLowerCase() !== current.pseudo.toLowerCase()
          ? { pseudoCustomizedAt: new Date() }
          : {}),
      },
      select: USER_SELECT,
    })
    return { ok: true, user: toAppUser(user) }
  } catch (error) {
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
        | 'invalid_chars'
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

  const available = await isPseudoAvailable(parsed.pseudo, current.id)
  if (!available) return { ok: false, reason: 'taken' }

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
    const row = await prisma.user.update({
      where: { id: current.id },
      data: {
        pseudo: parsed.pseudo,
        ...(current.pseudoCustomizedAt == null &&
        parsed.pseudo.toLowerCase() !== current.pseudo.toLowerCase()
          ? { pseudoCustomizedAt: new Date() }
          : {}),
      },
      select: USER_SELECT,
    })
    user = toAppUser(row)
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

  const appUrl = process.env.APP_URL?.trim()?.replace(/\/$/, '')
  if (!appUrl) {
    console.error('[auth] APP_URL is not set — cannot build email-change link')
    return { ok: false, reason: 'email_failed' }
  }

  const link = `${appUrl}/auth/callback?token=${encodeURIComponent(rawToken)}&next=${encodeURIComponent('/compte')}`
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
 * Permanently delete the current user, cloud objects, and auth-related rows.
 */
export async function deleteAccountForRequest(
  request: Request,
): Promise<DeleteAccountResult> {
  const current = await getUserFromRequest(request)
  if (!current) return { ok: false, reason: 'unauthorized' }

  try {
    const { purgeUserCloudStorage } = await import('./cloud.server')
    await purgeUserCloudStorage(current.id)
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
