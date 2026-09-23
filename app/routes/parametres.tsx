import type { MetaFunction } from '@remix-run/node'
import { ClientOnly } from 'remix-utils/client-only'
import { AppShell } from '~/components/AppShell'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { SettingsPanel } from '~/components/SettingsPanel'
import { t } from '~/lib/i18n'

export const meta: MetaFunction = () => [
  { title: `PolyRecorder — ${t('settings.title')}` },
]

export function shouldRevalidate() {
  return false
}

export default function SettingsRoute() {
  return (
    <AppShell>
      <ClientOnly fallback={null}>{() => <OverlayShortcuts />}</ClientOnly>
      <SettingsPanel />
    </AppShell>
  )
}
