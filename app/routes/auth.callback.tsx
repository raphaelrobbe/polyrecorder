import type { LoaderFunctionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import {
  consumeMagicLink,
  safeRedirectPath,
} from '~/service/auth.server'
import { redirectWithSession } from '~/service/session.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const next = safeRedirectPath(url.searchParams.get('next'))

  const result = await consumeMagicLink(token)
  if (!result.ok) {
    return redirect(`/connexion?error=${result.reason}`)
  }

  return redirectWithSession(next, request, result.sessionToken)
}
