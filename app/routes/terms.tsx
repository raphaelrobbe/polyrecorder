import type { MetaFunction } from '@remix-run/node'
import { ClientOnly } from 'remix-utils/client-only'
import { AppShell } from '~/components/AppShell'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { TermsPanel } from '~/components/TermsPanel'
import { t } from '~/lib/i18n'

export const meta: MetaFunction = () => [
  { title: `PolyRecorder — ${t('terms.title')}` },
]

export function shouldRevalidate() {
  return false
}

export default function TermsRoute() {
  return (
    <AppShell wide>
      <ClientOnly fallback={null}>{() => <OverlayShortcuts />}</ClientOnly>
      <TermsPanel />
    </AppShell>
  )
}
