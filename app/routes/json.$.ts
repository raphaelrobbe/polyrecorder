import type { LoaderFunctionArgs } from '@remix-run/node'

/**
 * Chrome DevTools Protocol discovery (`/json`, `/json/version`, …) sometimes
 * hits the app origin. Match the path so Remix does not log “No routes matched”.
 */
export async function loader(_args: LoaderFunctionArgs) {
  return new Response(null, { status: 204 })
}
