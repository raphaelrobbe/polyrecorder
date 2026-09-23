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
import { AuthCloseButton } from '~/components/AuthCloseButton'
import { Brand } from '~/components/Brand'
import { Button } from '~/components/Button'
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
    const email = String(form.get('email') ?? '')
    const result = await requestMagicLink(email)

    if (!result.ok) {
      return { ok: false as const, reason: result.reason }
    }

    const params = new URLSearchParams()
    const normalized = email.trim().toLowerCase()
    if (normalized) params.set('email', normalized)
    return redirectWithMagicLinkPreview(
      `/connexion/envoye?${params}`,
      request,
      result.previewLink,
    )
  } catch (error) {
    console.error('[connexion] action failed', error)
    return { ok: false as const, reason: 'email_failed' as const }
  }
}

export default function ConnexionRoute() {
  useLocale()
  const { error: linkError } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const submitting = navigation.state === 'submitting'

  const errorMessage =
    actionData && actionData.ok === false
      ? actionData.reason === 'invalid_email'
        ? t('auth.error.invalidEmail')
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
      <section className="relative rounded-[28px] border border-line bg-[var(--deck-fill)] px-6 py-7 shadow-deck backdrop-blur-[10px]">
        <AuthCloseButton />
        <h2 className="font-display mr-[2.8rem] m-0 mb-2 text-[1.45rem] font-bold tracking-[-0.02em] text-ink">
          {t('auth.signIn.title')}
        </h2>
        <p className="m-0 mb-5 text-[0.92rem] leading-[1.45] text-ink-soft">
          {t('auth.signIn.lead')}
        </p>
        <Form method="post" className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[0.84rem] font-semibold text-ink-soft">
            {t('auth.signIn.email')}
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="rounded-xl border border-line bg-surface px-3 py-2.5 text-[0.95rem] font-medium text-ink outline-none focus-visible:border-ink/35 focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ink)_12%,transparent)]"
              placeholder={t('auth.signIn.emailPlaceholder')}
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
      </section>
    </main>
  )
}
