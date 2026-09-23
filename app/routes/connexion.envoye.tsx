import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { data } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { AuthCloseButton } from '~/components/AuthCloseButton'
import { Brand } from '~/components/Brand'
import { Button } from '~/components/Button'
import { useLocale } from '~/hooks/useLocale'
import { t } from '~/lib/i18n'
import { consumeMagicLinkPreview } from '~/service/session.server'

export const meta: MetaFunction = () => [
  { title: `PolyRecorder — ${t('auth.sent.title')}` },
]

export async function loader({ request }: LoaderFunctionArgs) {
  const email = new URL(request.url).searchParams.get('email')
  const { previewLink, headers } = await consumeMagicLinkPreview(request)
  return data({ email, previewLink }, { headers })
}

export default function ConnexionEnvoyeRoute() {
  useLocale()
  const { email, previewLink } = useLoaderData<typeof loader>()

  return (
    <main className="mx-auto flex w-[min(440px,100%)] flex-col gap-7 px-4 py-10 animate-rise">
      <Brand />
      <section className="relative rounded-[28px] border border-line bg-[var(--deck-fill)] px-6 py-7 shadow-deck backdrop-blur-[10px]">
        <AuthCloseButton />
        <h2 className="font-display mr-[2.8rem] m-0 mb-2 text-[1.45rem] font-bold tracking-[-0.02em] text-ink">
          {t('auth.sent.title')}
        </h2>
        <p className="m-0 text-[0.92rem] leading-[1.45] text-ink-soft">
          {email
            ? t('auth.sent.bodyWithEmail', { email })
            : t('auth.sent.body')}
        </p>
        <p className="mt-4 mb-0 text-[0.85rem] leading-[1.4] text-ink-soft">
          {t('auth.sent.hint')}
        </p>
        {previewLink ? (
          <div className="mt-6 flex flex-col gap-2">
            <p className="m-0 text-[0.82rem] leading-[1.4] text-ink-soft">
              {t('auth.sent.devHint')}
            </p>
            <Button
              variant="default"
              className="bg-ink text-on-ink"
              onClick={() => {
                window.location.href = previewLink
              }}
            >
              {t('auth.sent.openLink')}
            </Button>
          </div>
        ) : null}
      </section>
      <p className="m-0 text-center text-[0.85rem] text-ink-soft">
        <Link to="/connexion" className="text-ink underline-offset-2 hover:underline">
          {t('auth.sent.retry')}
        </Link>
      </p>
    </main>
  )
}
