import type { MetaFunction } from '@remix-run/node'
import { ClientOnly } from 'remix-utils/client-only'
import RecorderHelp from '~/components/RecorderHelp.client'
import { t } from '~/lib/i18n'

export const meta: MetaFunction = () => [
  { title: `PolyRecorder — ${t('help.title')}` },
]

export function shouldRevalidate() {
  return false
}

export default function HelpRoute() {
  return (
    <ClientOnly
      fallback={
        <main className="flex min-h-[50vh] w-[min(440px,100%)] flex-col items-center justify-center animate-rise text-ink-soft">
          <p className="m-0 text-[0.9rem] font-semibold">{t('help.title')}</p>
        </main>
      }
    >
      {() => <RecorderHelp />}
    </ClientOnly>
  )
}
