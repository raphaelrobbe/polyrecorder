import { createCookieSessionStorage, redirect } from '@remix-run/node'
import { getSessionSecret } from './env.server'

const SESSION_COOKIE = '__polyrecorder_session'
const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30 // 30 days

type SessionData = {
  sessionToken: string
  /** One-shot flash: magic-link URL for local testing (never set in production). */
  magicLinkPreview?: string
}

function getStorage() {
  return createCookieSessionStorage<SessionData>({
    cookie: {
      name: SESSION_COOKIE,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secrets: [getSessionSecret()],
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE_S,
    },
  })
}

export async function getSessionToken(
  request: Request,
): Promise<string | null> {
  const session = await getStorage().getSession(request.headers.get('Cookie'))
  const token = session.get('sessionToken')
  return typeof token === 'string' && token.length > 0 ? token : null
}

export async function createSessionHeaders(
  request: Request,
  sessionToken: string,
): Promise<Headers> {
  const storage = getStorage()
  const session = await storage.getSession(request.headers.get('Cookie'))
  session.set('sessionToken', sessionToken)
  return new Headers({
    'Set-Cookie': await storage.commitSession(session, {
      maxAge: SESSION_MAX_AGE_S,
    }),
  })
}

export async function destroySessionHeaders(request: Request): Promise<Headers> {
  const storage = getStorage()
  const session = await storage.getSession(request.headers.get('Cookie'))
  return new Headers({
    'Set-Cookie': await storage.destroySession(session),
  })
}

export async function redirectWithSession(
  url: string,
  request: Request,
  sessionToken: string,
) {
  const headers = await createSessionHeaders(request, sessionToken)
  return redirect(url, { headers })
}

export async function redirectClearingSession(url: string, request: Request) {
  const headers = await destroySessionHeaders(request)
  return redirect(url, { headers })
}

/** Dev-only: stash the magic link in a flash cookie so the UI can open it. */
export async function redirectWithMagicLinkPreview(
  url: string,
  request: Request,
  previewLink: string | undefined,
) {
  if (!previewLink) return redirect(url)
  const storage = getStorage()
  const session = await storage.getSession(request.headers.get('Cookie'))
  session.flash('magicLinkPreview', previewLink)
  return redirect(url, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  })
}

/** Read + clear the one-shot magic-link preview flash. */
export async function consumeMagicLinkPreview(request: Request): Promise<{
  previewLink: string | null
  headers: Headers
}> {
  const storage = getStorage()
  const session = await storage.getSession(request.headers.get('Cookie'))
  const raw = session.get('magicLinkPreview')
  const previewLink = typeof raw === 'string' && raw.length > 0 ? raw : null
  return {
    previewLink,
    headers: new Headers({
      'Set-Cookie': await storage.commitSession(session),
    }),
  }
}
