import type { MetaFunction } from '@remix-run/node'
import { ClientOnly } from 'remix-utils/client-only'
import { AppShell } from '~/components/AppShell'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { SitemapPanel } from '~/components/SitemapPanel'
import { t } from '~/lib/i18n'
import { absoluteUrl, appUrlFromMatches, brandLogoUrl, pageMeta } from '~/lib/seo'

export const meta: MetaFunction = ({ matches }) => {
  const appUrl = appUrlFromMatches(matches)
  return pageMeta({
    title: `polyrecorder — ${t('sitemap.title')}`,
    description: t('seo.sitemap.description'),
    url: appUrl ? absoluteUrl(appUrl, '/sitemap') : undefined,
    image: appUrl ? brandLogoUrl(appUrl) : undefined,
  })
}

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
