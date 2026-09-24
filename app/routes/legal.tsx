import type { MetaFunction } from '@remix-run/node'
import { ClientOnly } from 'remix-utils/client-only'
import { AppShell } from '~/components/AppShell'
import { LegalNoticePanel } from '~/components/LegalNoticePanel'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { t } from '~/lib/i18n'

export const meta: MetaFunction = () => [
  { title: `PolyRecorder — ${t('legal.title')}` },
]

export function shouldRevalidate() {
  return false
}

export default function LegalNoticeRoute() {
  return (
    <AppShell wide>
      <ClientOnly fallback={null}>{() => <OverlayShortcuts />}</ClientOnly>
      <LegalNoticePanel />
    </AppShell>
  )
}
