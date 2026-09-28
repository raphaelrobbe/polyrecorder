import type { MetaFunction } from '@remix-run/node'
import { ClientOnly } from 'remix-utils/client-only'
import { AppShell } from '~/components/AppShell'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { TermsPanel } from '~/components/TermsPanel'
import { t } from '~/lib/i18n'
import { absoluteUrl, appUrlFromMatches, brandLogoUrl, pageMeta } from '~/lib/seo'

export const meta: MetaFunction = ({ matches }) => {
  const appUrl = appUrlFromMatches(matches)
  return pageMeta({
    title: `polyrecorder — ${t('terms.title')}`,
    description: t('seo.terms.description'),
    url: appUrl ? absoluteUrl(appUrl, '/terms') : undefined,
    image: appUrl ? brandLogoUrl(appUrl) : undefined,
  })
}

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
