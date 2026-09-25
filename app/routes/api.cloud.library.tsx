import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  createGroup,
  createRepertoire,
  createSong,
  deleteLibraryNode,
  deleteTrackAsset,
  getLibraryTree,
  openSong,
  renameLibraryNode,
  renameTrackAsset,
  setSongPublic,
  updateSongMasterVolume,
  updateTrackAssetOffset,
  updateTrackAssetOffsets,
  updateTrackAssetVolume,
} from '~/service/cloud.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const result = await getLibraryTree(request)
  if (!result.ok) {
    return json(result, {
      status: result.reason === 'unauthorized' ? 401 : 400,
    })
  }
  return json(result)
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = (await request.json()) as {
      intent?: string
      kind?: 'group' | 'repertoire' | 'song'
      id?: string
      name?: string
      groupId?: string
      repertoireId?: string
      songId?: string
      isPublic?: boolean
      offsetMs?: number
      volume?: number
      masterVolume?: number
      updates?: Array<{ id: string; offsetMs: number }>
    }
    const intent = String(body.intent ?? '')

    if (intent === 'createGroup') {
      const result = await createGroup(request, String(body.name ?? ''))
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'createRepertoire') {
      const result = await createRepertoire(
        request,
        String(body.groupId ?? ''),
        String(body.name ?? ''),
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'createSong') {
      const result = await createSong(
        request,
        String(body.repertoireId ?? ''),
        String(body.name ?? ''),
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'rename') {
      const kind = body.kind
      if (kind !== 'group' && kind !== 'repertoire' && kind !== 'song') {
        return json({ ok: false as const, reason: 'invalid' as const }, { status: 400 })
      }
      const result = await renameLibraryNode(
        request,
        kind,
        String(body.id ?? ''),
        String(body.name ?? ''),
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'renameTrack') {
      const result = await renameTrackAsset(
        request,
        String(body.id ?? ''),
        String(body.name ?? ''),
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'updateTrackOffset') {
      const result = await updateTrackAssetOffset(
        request,
        String(body.id ?? ''),
        Number(body.offsetMs),
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'syncTrackOffsets') {
      const result = await updateTrackAssetOffsets(
        request,
        Array.isArray(body.updates) ? body.updates : [],
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'updateTrackVolume') {
      const result = await updateTrackAssetVolume(
        request,
        String(body.id ?? ''),
        Number(body.volume),
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'updateSongMasterVolume') {
      const result = await updateSongMasterVolume(
        request,
        String(body.songId ?? body.id ?? ''),
        Number(body.masterVolume),
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'deleteTrack') {
      const result = await deleteTrackAsset(request, String(body.id ?? ''))
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'setSongPublic') {
      const result = await setSongPublic(
        request,
        String(body.songId ?? body.id ?? ''),
        Boolean(body.isPublic),
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'delete') {
      const kind = body.kind
      if (kind !== 'group' && kind !== 'repertoire' && kind !== 'song') {
        return json({ ok: false as const, reason: 'invalid' as const }, { status: 400 })
      }
      const result = await deleteLibraryNode(request, kind, String(body.id ?? ''))
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'openSong') {
      const result = await openSong(request, String(body.songId ?? ''))
      return json(result, {
        status: result.ok
          ? 200
          : result.reason === 'unauthorized'
            ? 401
            : result.reason === 'not_found'
              ? 404
              : 400,
      })
    }

    return json({ ok: false as const, reason: 'invalid' as const }, { status: 400 })
  } catch (error) {
    console.error('[api/cloud/library]', error)
    return json({ ok: false as const, reason: 'failed' as const }, { status: 500 })
  }
}
