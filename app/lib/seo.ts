import type { MetaDescriptor } from '@remix-run/node'

export type PageMetaInput = {
  title: string
  description?: string
  /** Absolute canonical URL. */
  url?: string
  /** Absolute Open Graph / Twitter image URL (square logo). */
  image?: string
  type?: 'website' | 'music.song'
  robots?: string
  siteName?: string
  /** e.g. fr_FR — primary locale for og:locale */
  locale?: string
}

/** Square app logo for link previews (title + description + thumbnail). */
export function brandLogoUrl(appUrl: string): string {
  return absoluteUrl(appUrl, '/icon-512.png')
}

/** Build a consistent title / description / OG / Twitter / canonical set. */
export function pageMeta({
  title,
  description,
  url,
  image,
  type = 'website',
  robots,
  siteName = 'polyrecorder',
  locale = 'fr_FR',
}: PageMetaInput): MetaDescriptor[] {
  const meta: MetaDescriptor[] = [{ title }]

  if (description) {
    meta.push({ name: 'description', content: description })
  }
  if (robots) {
    meta.push({ name: 'robots', content: robots })
  }
  if (url) {
    meta.push({ tagName: 'link', rel: 'canonical', href: url })
    meta.push({ property: 'og:url', content: url })
  }

  meta.push({ property: 'og:site_name', content: siteName })
  meta.push({ property: 'og:type', content: type })
  meta.push({ property: 'og:title', content: title })
  meta.push({ property: 'og:locale', content: locale })
  if (description) {
    meta.push({ property: 'og:description', content: description })
  }
  if (image) {
    meta.push({ property: 'og:image', content: image })
    meta.push({ property: 'og:image:type', content: 'image/png' })
    meta.push({ property: 'og:image:width', content: '512' })
    meta.push({ property: 'og:image:height', content: '512' })
    meta.push({ property: 'og:image:alt', content: siteName })
  }
  // Compact card: logo thumbnail + title + description (not a large banner).
  meta.push({ name: 'twitter:card', content: 'summary' })
  if (image) {
    meta.push({ name: 'twitter:image', content: image })
  }
  meta.push({ name: 'twitter:title', content: title })
  if (description) {
    meta.push({ name: 'twitter:description', content: description })
  }

  return meta
}

type MatchLike = { id: string; data: unknown }

/** Read `appUrl` from the root loader via Remix `matches`. */
export function appUrlFromMatches(matches: MatchLike[]): string {
  for (const match of matches) {
    if (match.id !== 'root' || !match.data || typeof match.data !== 'object') {
      continue
    }
    const data = match.data as { appUrl?: unknown }
    if (typeof data.appUrl === 'string' && data.appUrl) {
      return data.appUrl.replace(/\/$/, '')
    }
  }
  return ''
}

export function absoluteUrl(appUrl: string, path: string): string {
  const base = appUrl.replace(/\/$/, '')
  if (!path || path === '/') return `${base}/`
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}
