import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  createGroup,
  createRepertoire,
  createSong,
  createSongPart,
  deleteLibraryNode,
  deleteTrackAsset,
  getLibraryTree,
  openSong,
  renameLibraryNode,
  renameTrackAsset,
  reorderLibraryNode,
  setSongCollaboration,
  setSongPublic,
  updateSongPartMasterVolume,
  updateSongPartAlignPrefs,
  updateTrackAssetOffset,
  updateTrackAssetOffsets,
  updateTrackAssetVolume,
  updateTrackAssetVolumes,
  updateTrackAssetMuted,
  updateTrackAssetMutes,
  syncTrackAssetOrder,
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
      kind?: 'group' | 'repertoire' | 'song' | 'songPart'
      id?: string
      beforeId?: string | null
      name?: string
      partName?: string
      groupId?: string
      repertoireId?: string
      songId?: string
      songPartId?: string
      isPublic?: boolean
      allowsCollaboration?: boolean
      offsetMs?: number
      volume?: number
      muted?: boolean
      masterVolume?: number
      alignPrefs?: {
        autoAlignEnabled?: boolean
        showCalageWarnings?: boolean
        skipCountInPlayback?: boolean
        skipCountInDownload?: boolean
      }
      orderedIds?: string[]
      updates?: Array<{
        id: string
        offsetMs?: number
        volume?: number
        muted?: boolean
      }>
    }
    const intent = String(body.intent ?? '')
    /** `songId` used to carry a session id — it is a part id on legacy clients. */
    const songPartId = String(body.songPartId ?? body.songId ?? '')

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
        body.partName == null ? null : String(body.partName),
        body.alignPrefs,
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'createSongPart') {
      const result = await createSongPart(
        request,
        String(body.songId ?? ''),
        String(body.name ?? ''),
        body.alignPrefs,
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'rename') {
      const kind = body.kind
      if (
        kind !== 'group' &&
        kind !== 'repertoire' &&
        kind !== 'song' &&
        kind !== 'songPart'
      ) {
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
    if (intent === 'reorder') {
      const kind = body.kind
      if (
        kind !== 'group' &&
        kind !== 'repertoire' &&
        kind !== 'song' &&
        kind !== 'songPart'
      ) {
        return json({ ok: false as const, reason: 'invalid' as const }, { status: 400 })
      }
      const result = await reorderLibraryNode(
        request,
        kind,
        String(body.id ?? ''),
        body.beforeId == null ? null : String(body.beforeId),
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
        Array.isArray(body.updates)
          ? body.updates.map((u) => ({
              id: String(u.id ?? ''),
              offsetMs: Number(u.offsetMs),
            }))
          : [],
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
    if (intent === 'syncTrackVolumes') {
      const result = await updateTrackAssetVolumes(
        request,
        Array.isArray(body.updates)
          ? body.updates.map((u) => ({
              id: String(u.id ?? ''),
              volume: Number(u.volume),
            }))
          : [],
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'updateTrackMuted') {
      const result = await updateTrackAssetMuted(
        request,
        String(body.id ?? ''),
        Boolean(body.muted),
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'syncTrackMutes') {
      const result = await updateTrackAssetMutes(
        request,
        Array.isArray(body.updates)
          ? body.updates.map((u) => ({
              id: String(u.id ?? ''),
              muted: Boolean(u.muted),
            }))
          : [],
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'syncTrackOrder') {
      const result = await syncTrackAssetOrder(
        request,
        songPartId || String(body.id ?? ''),
        Array.isArray(body.orderedIds)
          ? body.orderedIds.map((id) => String(id ?? ''))
          : [],
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'updateSongMasterVolume') {
      const result = await updateSongPartMasterVolume(
        request,
        songPartId || String(body.id ?? ''),
        Number(body.masterVolume),
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'updateSongAlignPrefs') {
      const result = await updateSongPartAlignPrefs(
        request,
        songPartId || String(body.id ?? ''),
        body.alignPrefs,
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
    if (intent === 'setSongCollaboration') {
      const result = await setSongCollaboration(
        request,
        String(body.songId ?? body.id ?? ''),
        Boolean(body.allowsCollaboration),
      )
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'delete') {
      const kind = body.kind
      if (
        kind !== 'group' &&
        kind !== 'repertoire' &&
        kind !== 'song' &&
        kind !== 'songPart'
      ) {
        return json({ ok: false as const, reason: 'invalid' as const }, { status: 400 })
      }
      const result = await deleteLibraryNode(request, kind, String(body.id ?? ''))
      return json(result, { status: result.ok ? 200 : 400 })
    }
    if (intent === 'openSong') {
      const result = await openSong(request, songPartId)
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
