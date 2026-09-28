import type { MetaFunction } from '@remix-run/node'
import { useMatches } from '@remix-run/react'
import { ClientOnly } from 'remix-utils/client-only'
import { Brand } from '~/components/Brand'
import { JsonLd } from '~/components/JsonLd'
import RecorderMain from '~/components/RecorderMain.client'
import { t } from '~/lib/i18n'
import { absoluteUrl, appUrlFromMatches, brandLogoUrl, pageMeta } from '~/lib/seo'

export const meta: MetaFunction = ({ matches }) => {
  const appUrl = appUrlFromMatches(matches)
  const title = t('seo.home.title')
  const description = t('seo.home.description')
  return pageMeta({
    title,
    description,
    url: appUrl ? absoluteUrl(appUrl, '/') : undefined,
    image: appUrl ? brandLogoUrl(appUrl) : undefined,
  })
}

export function shouldRevalidate() {
  return false
}

export default function IndexRoute() {
  const matches = useMatches()
  const appUrl = appUrlFromMatches(matches)
  const description = t('seo.home.description')

  return (
    <>
      {appUrl ? (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                name: 'polyrecorder',
                url: absoluteUrl(appUrl, '/'),
                description,
                inLanguage: ['fr', 'en', 'de', 'no'],
              },
              {
                '@type': 'WebApplication',
                name: 'polyrecorder',
                url: absoluteUrl(appUrl, '/'),
                description,
                applicationCategory: 'MultimediaApplication',
                operatingSystem: 'Any',
                browserRequirements: 'Requires JavaScript and a microphone',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'EUR',
                },
              },
            ],
          }}
        />
      ) : null}
      <ClientOnly
        fallback={
          <main className="flex min-h-[50vh] w-[min(440px,100%)] flex-col items-center justify-center gap-4 animate-rise text-ink-soft">
            <Brand variant="hero" />
          </main>
        }
      >
        {() => <RecorderMain />}
      </ClientOnly>
    </>
  )
}
