import type { MetaFunction } from '@remix-run/node'
import { ClientOnly } from 'remix-utils/client-only'
import { AppShell } from '~/components/AppShell'
import { LibraryPanel } from '~/components/LibraryPanel'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { t } from '~/lib/i18n'

export const meta: MetaFunction = () => [
  { title: `PolyRecorder — ${t('library.title')}` },
]

export function shouldRevalidate() {
  return false
}

export default function LibraryRoute() {
  return (
    <AppShell wide>
      <ClientOnly fallback={null}>{() => <OverlayShortcuts />}</ClientOnly>
      <LibraryPanel />
    </AppShell>
  )
}
