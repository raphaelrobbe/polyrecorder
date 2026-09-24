import type { Track } from '../common/types'
import { t } from './i18n'
import {
  readActiveSongId,
  writeActiveSongId,
} from './cloudPrefs'
import { useSessionStore } from '../store/sessionStore'

export {
  readAutoCloudSave,
  writeAutoCloudSave,
  readActiveSongId,
  writeActiveSongId,
} from './cloudPrefs'

/** Set from RecorderApp when root auth user changes (HttpOnly cookie is not JS-readable). */
let cloudSignedIn = false

export function setCloudSignedIn(signedIn: boolean): void {
  cloudSignedIn = signedIn
}

function patchTrack(trackId: number, partial: Partial<Track>): void {
  const tracks = useSessionStore
    .getState()
    .tracks.map((track) =>
      track.id === trackId ? { ...track, ...partial } : track,
    )
  useSessionStore.getState().patch({ tracks })
}

export async function uploadTrackToCloud(
  trackId: number,
  options?: { quietIfUnauthorized?: boolean },
): Promise<boolean> {
  if (useSessionStore.getState().readOnlySession) return false
  const track = useSessionStore.getState().tracks.find((t) => t.id === trackId)
  if (!track || track.blob.size === 0) return false
  if (track.cloudStatus === 'uploading' || track.cloudStatus === 'synced') {
    return track.cloudStatus === 'synced'
  }

  patchTrack(trackId, { cloudStatus: 'uploading' })

  try {
    const songId =
      useSessionStore.getState().activeSongId ?? readActiveSongId()
    const sessionTitle = useSessionStore.getState().sessionTitle
    const contentType = track.blob.type || 'audio/webm'

    const presignRes = await fetch('/api/cloud/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songId,
        name: track.name,
        contentType,
        byteSize: track.blob.size,
        durationMs: track.durationMs,
        offsetMs: track.offsetMs,
        clientTrackId: track.id,
        sessionTitle,
      }),
    })
    const presign = (await presignRes.json()) as
      | {
          ok: true
          uploadUrl: string
          trackAssetId: string
          songId: string
        }
      | { ok: false; reason: string }

    if (!presign.ok) {
      if (
        presign.reason === 'unauthorized' &&
        options?.quietIfUnauthorized
      ) {
        patchTrack(trackId, { cloudStatus: 'local' })
        return false
      }
      patchTrack(trackId, { cloudStatus: 'error' })
      useSessionStore.getState().setError(
        presign.reason === 'too_large'
          ? t('cloud.error.tooLarge')
          : presign.reason === 's3_not_configured'
            ? t('cloud.error.s3NotConfigured')
            : presign.reason === 'unauthorized'
              ? t('cloud.error.unauthorized')
              : t('cloud.error.uploadFailed'),
      )
      return false
    }

    writeActiveSongId(presign.songId)
    useSessionStore.getState().setActiveSongId(presign.songId)
    useSessionStore.getState().patch({ deckSongId: presign.songId })
    patchTrack(trackId, { cloudTrackId: presign.trackAssetId })

    const putRes = await fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: track.blob,
    })
    if (!putRes.ok) {
      throw new Error(`S3 PUT ${putRes.status}`)
    }

    const completeRes = await fetch('/api/cloud/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackAssetId: presign.trackAssetId }),
    })
    const complete = (await completeRes.json()) as
      | { ok: true }
      | { ok: false; reason: string }

    if (!complete.ok) {
      patchTrack(trackId, { cloudStatus: 'error' })
      useSessionStore.getState().setError(t('cloud.error.uploadFailed'))
      return false
    }

    patchTrack(trackId, {
      cloudStatus: 'synced',
      cloudTrackId: presign.trackAssetId,
    })
    return true
  } catch (error) {
    console.error('[cloud] uploadTrackToCloud failed', error)
    patchTrack(trackId, { cloudStatus: 'error' })
    useSessionStore.getState().setError(t('cloud.error.uploadFailed'))
    return false
  }
}

export async function maybeAutoUploadTrack(trackId: number): Promise<void> {
  if (!cloudSignedIn) return
  if (useSessionStore.getState().readOnlySession) return
  const { autoCloudSave } = useSessionStore.getState()
  if (!autoCloudSave) return
  await uploadTrackToCloud(trackId, { quietIfUnauthorized: true })
}

export type OpenedCloudSong = {
  song: {
    id: string
    name: string
    repertoireId: string
    isPublic: boolean
    groupName: string
    repertoireName: string
    ownerPseudo: string | null
  }
  tracks: Track[]
  isOwner: boolean
}

export async function fetchAndHydrateSong(
  songId: string,
  options?: { quiet?: boolean },
): Promise<OpenedCloudSong | null> {
  const res = await fetch('/api/cloud/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent: 'openSong', songId }),
  })
  const data = (await res.json()) as
    | {
        ok: true
        isOwner: boolean
        song: {
          id: string
          name: string
          repertoireId: string
          isPublic: boolean
          groupName: string
          repertoireName: string
          ownerPseudo: string | null
        }
        tracks: Array<{
          id: string
          name: string
          url: string
          durationMs: number
          offsetMs: number
          contentType: string
        }>
      }
    | { ok: false; reason: string }

  if (!data.ok) {
    if (!options?.quiet) {
      useSessionStore.getState().setError(
        data.reason === 'unauthorized'
          ? t('cloud.error.unauthorized')
          : data.reason === 's3_not_configured'
            ? t('cloud.error.s3NotConfigured')
            : t('cloud.error.openFailed'),
      )
    }
    return null
  }

  const tracks: Track[] = []
  let counter = 0
  for (const remote of data.tracks) {
    const response = await fetch(remote.url)
    if (!response.ok) {
      if (!options?.quiet) {
        useSessionStore.getState().setError(t('cloud.error.openFailed'))
      }
      return null
    }
    const blob = await response.blob()
    counter += 1
    tracks.push({
      id: counter,
      name: remote.name,
      blob,
      url: URL.createObjectURL(blob),
      durationMs: remote.durationMs,
      offsetMs: remote.offsetMs,
      cloudStatus: 'synced',
      cloudTrackId: remote.id,
    })
  }

  return { song: data.song, tracks, isOwner: data.isOwner }
}
