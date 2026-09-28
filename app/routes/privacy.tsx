import type { MetaFunction } from '@remix-run/node'
import { ClientOnly } from 'remix-utils/client-only'
import { AppShell } from '~/components/AppShell'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { PrivacyPanel } from '~/components/PrivacyPanel'
import { t } from '~/lib/i18n'
import { absoluteUrl, appUrlFromMatches, brandLogoUrl, pageMeta } from '~/lib/seo'

export const meta: MetaFunction = ({ matches }) => {
  const appUrl = appUrlFromMatches(matches)
  return pageMeta({
    title: `polyrecorder — ${t('privacy.title')}`,
    description: t('seo.privacy.description'),
    url: appUrl ? absoluteUrl(appUrl, '/privacy') : undefined,
    image: appUrl ? brandLogoUrl(appUrl) : undefined,
  })
}

export function shouldRevalidate() {
  return false
}

export default function PrivacyRoute() {
  return (
    <AppShell wide>
      <ClientOnly fallback={null}>{() => <OverlayShortcuts />}</ClientOnly>
      <PrivacyPanel />
    </AppShell>
  )
}
