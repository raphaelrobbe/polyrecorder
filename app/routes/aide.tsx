import type { MetaFunction } from '@remix-run/node'
import { ClientOnly } from 'remix-utils/client-only'
import { AppShell } from '~/components/AppShell'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { HelpPanel } from '~/components/HelpPanel'
import { t } from '~/lib/i18n'
import { absoluteUrl, appUrlFromMatches, brandLogoUrl, pageMeta } from '~/lib/seo'

export const meta: MetaFunction = ({ matches }) => {
  const appUrl = appUrlFromMatches(matches)
  return pageMeta({
    title: `polyrecorder — ${t('help.title')}`,
    description: t('seo.help.description'),
    url: appUrl ? absoluteUrl(appUrl, '/aide') : undefined,
    image: appUrl ? brandLogoUrl(appUrl) : undefined,
  })
}

export function shouldRevalidate() {
  return false
}

export default function HelpRoute() {
  return (
    <AppShell>
      <ClientOnly fallback={null}>{() => <OverlayShortcuts />}</ClientOnly>
      <HelpPanel />
    </AppShell>
  )
}
