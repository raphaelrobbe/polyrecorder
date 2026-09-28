import { listSitemapEntries, renderSitemapXml } from '~/lib/seo.server'

/** XML sitemap for search engines (HTML plan du site stays at /sitemap). */
export async function loader() {
  try {
    const entries = await listSitemapEntries()
    return new Response(renderSitemapXml(entries), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[sitemap.xml]', error)
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
