import type { MetaFunction } from '@remix-run/node'
import { ClientOnly } from 'remix-utils/client-only'
import RecorderMain from '~/components/RecorderMain.client'
import { t } from '~/lib/i18n'

export const meta: MetaFunction = () => [
  { title: 'PolyRecorder' },
  { name: 'description', content: t('brand.tagline') },
]

export function shouldRevalidate() {
  return false
}

export default function IndexRoute() {
  return (
    <ClientOnly
      fallback={
        <main className="flex min-h-[50vh] w-[min(440px,100%)] flex-col items-center justify-center gap-3 animate-rise text-ink-soft">
          <p className="m-0 text-[0.9rem] font-semibold">PolyRecorder</p>
        </main>
      }
    >
      {() => <RecorderMain />}
    </ClientOnly>
  )
}
