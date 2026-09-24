import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node'
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react'
import { useEffect } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { Brand } from '~/components/Brand'
import { Button } from '~/components/Button'
import { Deck } from '~/components/Deck'
import { DeckOverlayPanel } from '~/components/DeckOverlayPanel'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { useLocale } from '~/hooks/useLocale'
import { t } from '~/lib/i18n'
import {
  getUserFromRequest,
  requestMagicLink,
} from '~/service/auth.server'
import { redirectWithMagicLinkPreview } from '~/service/session.server'
import { redirect } from '@remix-run/node'

export const meta: MetaFunction = () => [
  { title: `PolyRecorder — ${t('auth.signIn.title')}` },
]

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromRequest(request)
  if (user) return redirect('/')
  const error = new URL(request.url).searchParams.get('error')
  return { error }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const form = await request.formData()
    const identifier = String(form.get('identifier') ?? form.get('email') ?? '')
    const result = await requestMagicLink(identifier)

    if (!result.ok) {
      console.error('[connexion] magic link failed', {
        reason: result.reason,
        detail: result.detail,
      })
      return {
        ok: false as const,
        reason: result.reason,
        detail: result.detail,
      }
    }

    const params = new URLSearchParams()
    const trimmed = identifier.trim()
    // Only echo back as email query when it still looks like an email after @ strip.
    let display = trimmed.startsWith('@') ? trimmed.slice(1).trim() : trimmed
    if (display.includes('@')) {
      params.set('email', display.toLowerCase())
    }
    return redirectWithMagicLinkPreview(
      `/connexion/envoye?${params}`,
      request,
      result.previewLink,
    )
  } catch (error) {
    const detail =
      error instanceof Error
        ? `${error.name}: ${error.message}`.slice(0, 240)
        : String(error).slice(0, 240)
    console.error('[connexion] action failed', detail, error)
    return {
      ok: false as const,
      reason: 'email_failed' as const,
      detail,
    }
  }
}

export default function ConnexionRoute() {
  useLocale()
  const { error: linkError } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const submitting = navigation.state === 'submitting'

  useEffect(() => {
    if (actionData && actionData.ok === false) {
      console.error(
        '[connexion] actionData.reason =',
        actionData.reason,
        actionData.detail ? `| detail = ${actionData.detail}` : '',
      )
    }
  }, [actionData])

  const errorMessage =
    actionData && actionData.ok === false
      ? actionData.reason === 'invalid_email'
        ? t('auth.error.invalidIdentifier')
        : actionData.reason === 'rate_limited'
          ? t('auth.error.rateLimited')
          : t('auth.error.emailFailed')
      : linkError === 'expired'
        ? t('auth.error.linkExpired')
        : linkError === 'used'
          ? t('auth.error.linkUsed')
          : linkError
            ? t('auth.error.linkInvalid')
            : null

  return (
    <main className="mx-auto flex w-[min(440px,100%)] flex-col gap-7 px-4 py-10 animate-rise">
      <Brand />
      <ClientOnly fallback={null}>{() => <OverlayShortcuts />}</ClientOnly>
      <Deck>
        <DeckOverlayPanel
          title={t('auth.signIn.title')}
          closeAriaLabel={t('auth.close')}
          bodyClassName="flex flex-col gap-4"
        >
          <p className="m-0 -mt-2 mb-1 text-[0.92rem] leading-[1.45] text-ink-soft">
            {t('auth.signIn.lead')}
          </p>
          <Form method="post" className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-[0.84rem] font-semibold text-ink-soft">
              {t('auth.signIn.identifier')}
              <input
                type="text"
                name="identifier"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="rounded-xl border border-line bg-surface px-3 py-2.5 text-[0.95rem] font-medium text-ink outline-none focus-visible:border-ink/35 focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ink)_12%,transparent)]"
                placeholder={t('auth.signIn.identifierPlaceholder')}
              />
            </label>
            {errorMessage ? (
              <p
                className="m-0 text-[0.85rem] font-semibold text-record"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="default"
              disabled={submitting}
              className="bg-ink text-on-ink"
            >
              {submitting ? t('auth.signIn.sending') : t('auth.signIn.submit')}
            </Button>
          </Form>
        </DeckOverlayPanel>
      </Deck>
    </main>
  )
}
