import { getAppUrl } from '~/service/env.server'
import { prisma } from '~/service/db.server'
import { librarySongPath, libraryUserPath } from '~/lib/libraryPaths'

export type SitemapEntry = {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority?: number
}

const STATIC_PATHS: Array<{
  path: string
  changefreq: SitemapEntry['changefreq']
  priority: number
}> = [
  { path: '/', changefreq: 'weekly', priority: 1 },
  { path: '/aide', changefreq: 'monthly', priority: 0.7 },
  { path: '/legal', changefreq: 'yearly', priority: 0.3 },
  { path: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { path: '/terms', changefreq: 'yearly', priority: 0.3 },
  { path: '/contact', changefreq: 'yearly', priority: 0.3 },
  { path: '/sitemap', changefreq: 'monthly', priority: 0.2 },
]

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Public URLs for crawlers (static pages + public library / sessions). */
export async function listSitemapEntries(): Promise<SitemapEntry[]> {
  const appUrl = getAppUrl()
  const entries: SitemapEntry[] = STATIC_PATHS.map(({ path, changefreq, priority }) => ({
    loc: path === '/' ? `${appUrl}/` : `${appUrl}${path}`,
    changefreq,
    priority,
  }))

  const [publicParts, publicSongs, publicUsers] = await Promise.all([
    prisma.songPart.findMany({
      where: { song: { isPublic: true } },
      select: { id: true, updatedAt: true, lastOpenedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    }),
    prisma.song.findMany({
      where: { isPublic: true },
      select: { id: true, updatedAt: true, lastOpenedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    }),
    prisma.user.findMany({
      where: {
        groups: {
          some: {
            repertoires: {
              some: { songs: { some: { isPublic: true } } },
            },
          },
        },
      },
      select: { pseudo: true, updatedAt: true },
      take: 2000,
    }),
  ])

  for (const part of publicParts) {
    const last = part.lastOpenedAt > part.updatedAt ? part.lastOpenedAt : part.updatedAt
    entries.push({
      loc: `${appUrl}/session/${encodeURIComponent(part.id)}`,
      lastmod: isoDay(last),
      changefreq: 'weekly',
      priority: 0.8,
    })
  }

  for (const song of publicSongs) {
    const last = song.lastOpenedAt > song.updatedAt ? song.lastOpenedAt : song.updatedAt
    entries.push({
      loc: `${appUrl}${librarySongPath(song.id)}`,
      lastmod: isoDay(last),
      changefreq: 'weekly',
      priority: 0.6,
    })
  }

  for (const user of publicUsers) {
    const pseudo = user.pseudo.trim()
    if (!pseudo) continue
    entries.push({
      loc: `${appUrl}${libraryUserPath(pseudo)}`,
      lastmod: isoDay(user.updatedAt),
      changefreq: 'weekly',
      priority: 0.5,
    })
  }

  return entries
}

export function renderSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const bits = [`    <loc>${escapeXml(entry.loc)}</loc>`]
      if (entry.lastmod) bits.push(`    <lastmod>${entry.lastmod}</lastmod>`)
      if (entry.changefreq) {
        bits.push(`    <changefreq>${entry.changefreq}</changefreq>`)
      }
      if (entry.priority != null) {
        bits.push(`    <priority>${entry.priority.toFixed(1)}</priority>`)
      }
      return `  <url>\n${bits.join('\n')}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
