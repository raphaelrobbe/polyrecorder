import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { ClientOnly } from 'remix-utils/client-only'
import { AccountPanel } from '~/components/AccountPanel'
import { AppShell } from '~/components/AppShell'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { t } from '~/lib/i18n'
import {
  deleteAccountForRequest,
  getUserFromRequest,
  updateProfileForRequest,
} from '~/service/auth.server'
import { redirectClearingSession } from '~/service/session.server'

export const meta: MetaFunction = () => [
  { title: `PolyRecorder — ${t('account.title')}` },
]

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromRequest(request)
  if (!user) return redirect('/connexion')
  return { user }
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData()
  const intent = String(form.get('intent') ?? 'save')

  if (intent === 'delete') {
    const result = await deleteAccountForRequest(request)
    if (!result.ok) {
      if (result.reason === 'unauthorized') return redirect('/connexion')
      return { ok: false as const, intent: 'delete' as const, reason: result.reason }
    }
    return redirectClearingSession('/', request)
  }

  const email = String(form.get('email') ?? '')
  const pseudo = String(form.get('pseudo') ?? '')
  const result = await updateProfileForRequest(request, email, pseudo)
  if (!result.ok) {
    if (result.reason === 'unauthorized') return redirect('/connexion')
    return { ok: false as const, intent: 'save' as const, reason: result.reason }
  }
  return {
    ok: true as const,
    intent: 'save' as const,
    user: result.user,
    emailChangePending: result.emailChangePending,
    previewLink: result.previewLink,
  }
}

export default function CompteRoute() {
  const { user } = useLoaderData<typeof loader>()

  return (
    <AppShell>
      <ClientOnly fallback={null}>{() => <OverlayShortcuts />}</ClientOnly>
      <AccountPanel user={user} />
    </AppShell>
  )
}
