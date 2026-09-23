import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { data } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { ClientOnly } from 'remix-utils/client-only'
import { Brand } from '~/components/Brand'
import { Button } from '~/components/Button'
import { Deck } from '~/components/Deck'
import { DeckOverlayPanel } from '~/components/DeckOverlayPanel'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { useLocale } from '~/hooks/useLocale'
import { t } from '~/lib/i18n'
import { consumeMagicLinkPreview } from '~/service/session.server'

export const meta: MetaFunction = () => [
  { title: `PolyRecorder — ${t('auth.sent.title')}` },
]

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const email = new URL(request.url).searchParams.get('email')
    const { previewLink, headers } = await consumeMagicLinkPreview(request)
    return data({ email, previewLink }, { headers })
  } catch (error) {
    console.error('[connexion/envoye] loader failed', error)
    const email = new URL(request.url).searchParams.get('email')
    return { email, previewLink: null }
  }
}

export default function ConnexionEnvoyeRoute() {
  useLocale()
  const { email, previewLink } = useLoaderData<typeof loader>()

  return (
    <main className="mx-auto flex w-[min(440px,100%)] flex-col gap-7 px-4 py-10 animate-rise">
      <Brand />
      <ClientOnly fallback={null}>{() => <OverlayShortcuts />}</ClientOnly>
      <Deck>
        <DeckOverlayPanel
          title={t('auth.sent.title')}
          closeAriaLabel={t('auth.close')}
          bodyClassName="flex flex-col gap-4"
        >
          <p className="m-0 -mt-2 text-[0.92rem] leading-[1.45] text-ink-soft">
            {email
              ? t('auth.sent.bodyWithEmail', { email })
              : t('auth.sent.body')}
          </p>
          <p className="m-0 text-[0.85rem] leading-[1.4] text-ink-soft">
            {t('auth.sent.hint')}
          </p>
          {previewLink ? (
            <div className="flex flex-col gap-2">
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
        </DeckOverlayPanel>
      </Deck>
      <p className="m-0 text-center text-[0.85rem] text-ink-soft">
        <Link
          to="/connexion"
          className="text-ink underline-offset-2 hover:underline"
        >
          {t('auth.sent.retry')}
        </Link>
      </p>
    </main>
  )
}
