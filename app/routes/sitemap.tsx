import type { MetaFunction } from '@remix-run/node'
import { ClientOnly } from 'remix-utils/client-only'
import { AppShell } from '~/components/AppShell'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { SitemapPanel } from '~/components/SitemapPanel'
import { t } from '~/lib/i18n'

export const meta: MetaFunction = () => [
  { title: `PolyRecorder — ${t('sitemap.title')}` },
]

export function shouldRevalidate() {
  return false
}

export default function SitemapRoute() {
  return (
    <AppShell wide>
      <ClientOnly fallback={null}>{() => <OverlayShortcuts />}</ClientOnly>
      <SitemapPanel />
    </AppShell>
  )
}
