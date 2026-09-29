import type { LoaderFunctionArgs } from '@remix-run/node'

/** Exact `/json` CDP probe (sibling of `json.$`). */
export async function loader(_args: LoaderFunctionArgs) {
  return new Response(null, { status: 204 })
}
