import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node'
import { useActionData, useLoaderData } from '@remix-run/react'
import { ClientOnly } from 'remix-utils/client-only'
import { AppShell } from '~/components/AppShell'
import {
  ContactPanel,
  type ContactActionData,
} from '~/components/ContactPanel'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { isValidEmail, normalizeEmail } from '~/lib/email'
import { t } from '~/lib/i18n'
import { LEGAL } from '~/lib/legal'
import { absoluteUrl, appUrlFromMatches, brandLogoUrl, pageMeta } from '~/lib/seo'
import { getUserFromRequest } from '~/service/auth.server'
import { sendMail } from '~/service/email.server'
import {
  getTurnstileSiteKey,
  verifyTurnstileToken,
} from '~/service/turnstile.server'

const MESSAGE_MAX = 4000
const RATE_WINDOW_MS = 15 * 60 * 1000
const RATE_MAX = 5

/** Simple in-memory rate limit (per process). */
const rateHits = new Map<string, number[]>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const prev = rateHits.get(key) ?? []
  const recent = prev.filter((ts) => now - ts < RATE_WINDOW_MS)
  if (recent.length >= RATE_MAX) {
    rateHits.set(key, recent)
    return true
  }
  recent.push(now)
  rateHits.set(key, recent)
  return false
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const meta: MetaFunction = ({ matches }) => {
  const appUrl = appUrlFromMatches(matches)
  return pageMeta({
    title: `polyrecorder — ${t('contact.title')}`,
    description: t('seo.contact.description'),
    url: appUrl ? absoluteUrl(appUrl, '/contact') : undefined,
    image: appUrl ? brandLogoUrl(appUrl) : undefined,
  })
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromRequest(request)
  return {
    userEmail: user?.email ?? null,
    turnstileSiteKey: getTurnstileSiteKey(),
  }
}

export async function action({
  request,
}: ActionFunctionArgs): Promise<ContactActionData> {
  const form = await request.formData()
  const honeypot = String(form.get('company') ?? '').trim()
  if (honeypot) {
    // Pretend success so bots don't learn.
    return { ok: true }
  }

  const user = await getUserFromRequest(request)
  const rawEmail = user?.email
    ? user.email
    : String(form.get('email') ?? '')
  const email = normalizeEmail(rawEmail)
  const message = String(form.get('message') ?? '').trim()
  const captchaToken = String(form.get('cf-turnstile-response') ?? '')

  if (!isValidEmail(email)) {
    return { ok: false, reason: 'invalid_email' }
  }
  if (!message || message.length > MESSAGE_MAX) {
    return { ok: false, reason: 'invalid_message' }
  }

  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null

  const captcha = await verifyTurnstileToken(captchaToken, ip)
  if (!captcha.ok) {
    return { ok: false, reason: 'captcha' }
  }

  const rateKey = `${email}|${ip ?? 'unknown'}`
  if (rateLimited(rateKey)) {
    return { ok: false, reason: 'rate_limited' }
  }

  const subject = `[polyrecorder contact] ${email}`
  const text = `From: ${email}\n\n${message}`
  const html = `<p><strong>From:</strong> ${escapeHtml(email)}</p><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>`

  const sent = await sendMail({
    to: LEGAL.contactEmail,
    replyTo: email,
    subject,
    text,
    html,
  })
  if (!sent.ok) {
    return { ok: false, reason: 'send_failed' }
  }
  return { ok: true }
}

export default function ContactRoute() {
  const { turnstileSiteKey } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  return (
    <AppShell wide>
      <ClientOnly fallback={null}>{() => <OverlayShortcuts />}</ClientOnly>
      <ContactPanel
        turnstileSiteKey={turnstileSiteKey}
        actionData={actionData}
      />
    </AppShell>
  )
}
