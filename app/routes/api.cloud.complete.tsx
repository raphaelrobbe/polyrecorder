import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { completeTrackUpload } from '~/service/cloud.server'

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
    const body = (await request.json()) as { trackAssetId?: string }
    const result = await completeTrackUpload(
      request,
      String(body.trackAssetId ?? ''),
    )
    if (!result.ok) {
      const status =
        result.reason === 'unauthorized'
          ? 401
          : result.reason === 'not_found'
            ? 404
            : result.reason === 'incomplete'
              ? 409
              : result.reason === 's3_not_configured'
                ? 503
                : 400
      return json(result, { status })
    }
    return json(result)
  } catch (error) {
    console.error('[api/cloud/complete]', error)
    return json({ ok: false as const, reason: 'failed' as const }, { status: 500 })
  }
}
