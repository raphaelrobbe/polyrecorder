import type { LoaderFunctionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'

/** Legacy `/song/:songPartId` → `/session/:songPartId`. */
export async function loader({ params }: LoaderFunctionArgs) {
  const id = String(params.songId ?? '')
  if (!id) throw new Response('Not Found', { status: 404 })
  return redirect(`/session/${encodeURIComponent(id)}`, 301)
}

export default function SongLegacyRedirect() {
  return null
}
