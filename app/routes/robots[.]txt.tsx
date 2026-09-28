import { getAppUrl } from '~/service/env.server'

/** Crawler instructions — keep private / API surfaces out of the index. */
export async function loader() {
  const appUrl = getAppUrl()
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /compte',
    'Disallow: /connexion',
    'Disallow: /parametres',
    'Disallow: /bibliotheque',
    'Disallow: /groupes',
    'Disallow: /auth/',
    'Disallow: /api/',
    '',
    `Sitemap: ${appUrl}/sitemap.xml`,
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
