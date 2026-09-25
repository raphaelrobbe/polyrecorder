import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { presignTrackUpload } from '~/service/cloud.server'

/** Avoid Remix “no loader” HTML when the URL is opened or prefetched as GET. */
export async function loader(_args: LoaderFunctionArgs) {
  return json(
    { ok: false as const, reason: 'method_not_allowed' as const },
    { status: 405 },
  )
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ ok: false as const, reason: 'invalid' as const }, { status: 405 })
  }
  try {
    const body = (await request.json()) as {
      songId?: string | null
      name?: string
      contentType?: string
      byteSize?: number
      durationMs?: number
      offsetMs?: number
      volume?: number | null
      clientTrackId?: number | null
      sessionTitle?: string | null
    }
    const result = await presignTrackUpload(request, {
      songId: body.songId,
      name: String(body.name ?? ''),
      contentType: String(body.contentType ?? 'audio/webm'),
      byteSize: Number(body.byteSize ?? 0),
      durationMs: Number(body.durationMs ?? 0),
      offsetMs: Number(body.offsetMs ?? 0),
      volume: body.volume == null ? null : Number(body.volume),
      clientTrackId: body.clientTrackId ?? null,
      sessionTitle: body.sessionTitle ?? null,
    })
    if (!result.ok) {
      const status =
        result.reason === 'unauthorized'
          ? 401
          : result.reason === 'too_large'
            ? 413
            : result.reason === 's3_not_configured'
              ? 503
              : 400
      return json(result, { status })
    }
    return json(result)
  } catch (error) {
    console.error('[api/cloud/presign]', error)
    return json({ ok: false as const, reason: 'failed' as const }, { status: 500 })
  }
}
