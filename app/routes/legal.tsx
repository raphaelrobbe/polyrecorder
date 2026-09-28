import type { MetaFunction } from '@remix-run/node'
import { ClientOnly } from 'remix-utils/client-only'
import { AppShell } from '~/components/AppShell'
import { LegalNoticePanel } from '~/components/LegalNoticePanel'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { t } from '~/lib/i18n'
import { absoluteUrl, appUrlFromMatches, brandLogoUrl, pageMeta } from '~/lib/seo'

export const meta: MetaFunction = ({ matches }) => {
  const appUrl = appUrlFromMatches(matches)
  return pageMeta({
    title: `polyrecorder — ${t('legal.title')}`,
    description: t('seo.legal.description'),
    url: appUrl ? absoluteUrl(appUrl, '/legal') : undefined,
    image: appUrl ? brandLogoUrl(appUrl) : undefined,
  })
}

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
