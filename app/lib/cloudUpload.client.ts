import type { Track } from '../common/types'
import { t } from './i18n'
import { writeActiveSongPartId } from './cloudPrefs'
import { useSessionStore } from '../store/sessionStore'

export {
  readAutoCloudSave,
  writeAutoCloudSave,
  readActiveSongPartId,
  writeActiveSongPartId,
} from './cloudPrefs'

/** Set from RecorderApp when root auth user changes (HttpOnly cookie is not JS-readable). */
let cloudSignedIn = false
let cloudUserPseudo: string | null = null

export function setCloudSignedIn(
  signedIn: boolean,
  pseudo?: string | null,
): void {
  cloudSignedIn = signedIn
  cloudUserPseudo = signedIn ? (pseudo?.trim() || null) : null
}

export function isCloudSignedIn(): boolean {
  return cloudSignedIn
}

function patchTrack(trackId: number, partial: Partial<Track>): void {
  const tracks = useSessionStore
    .getState()
    .tracks.map((track) =>
      track.id === trackId ? { ...track, ...partial } : track,
    )
  useSessionStore.getState().patch({ tracks })
}

function canContributeCloudTracks(): boolean {
  const state = useSessionStore.getState()
  return !state.readOnlySession || state.canCloudContribute
}

export async function uploadTrackToCloud(
  trackId: number,
  options?: { quietIfUnauthorized?: boolean },
): Promise<boolean> {
  if (!canContributeCloudTracks()) return false
  const track = useSessionStore.getState().tracks.find((t) => t.id === trackId)
  if (!track || track.blob.size === 0) return false
  if (track.isMetronome) return false
  if (track.cloudStatus === 'uploading' || track.cloudStatus === 'synced') {
    return track.cloudStatus === 'synced'
  }

  patchTrack(trackId, { cloudStatus: 'uploading' })

  try {
    // Store only — never fall back to localStorage (stale ids must not attach).
    const songPartId = useSessionStore.getState().activeSongPartId
    const sessionTitle = useSessionStore.getState().sessionTitle
    const metronomeBpm = useSessionStore.getState().metronomeBpm
    const metroTrack = useSessionStore
      .getState()
      .tracks.find((row) => row.isMetronome)
    const metronomeVolume = metroTrack
      ? (useSessionStore.getState().trackVolumes[metroTrack.id] ?? 1)
      : 1
    const contentType = track.blob.type || 'audio/webm'

    const presignRes = await fetch('/api/cloud/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songPartId,
        name: track.name,
        contentType,
        byteSize: track.blob.size,
        durationMs: track.durationMs,
        offsetMs: track.offsetMs,
        volume: useSessionStore.getState().trackVolumes[trackId] ?? 1,
        muted: !useSessionStore.getState().enabledTrackIds.includes(trackId),
        clientTrackId: track.id,
        sessionTitle,
        metronomeBpm,
        metronomeVolume,
      }),
    })
    const presign = (await presignRes.json()) as
      | {
          ok: true
          uploadUrl: string
          trackAssetId: string
          songPartId: string
          songId: string
          libraryPath: {
            ownerPseudo: string
            groupId: string
            groupName: string
            repertoireId: string
            repertoireName: string
            songId: string
            songName: string
          } | null
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

    writeActiveSongPartId(presign.songPartId)
    const store = useSessionStore.getState()
    store.setActiveSongPartId(presign.songPartId)
    const firstCloudBinding = store.songWorkName == null
    store.patch({
      deckSongPartId: presign.songPartId,
      deckSongId: presign.songId,
      ...(presign.libraryPath
        ? {
            deckLibraryPath: {
              ownerPseudo: presign.libraryPath.ownerPseudo,
              groupId: presign.libraryPath.groupId,
              groupName: presign.libraryPath.groupName,
              repertoireId: presign.libraryPath.repertoireId,
              repertoireName: presign.libraryPath.repertoireName,
              songId: presign.libraryPath.songId,
              songName: presign.libraryPath.songName,
            },
            songWorkName: presign.libraryPath.songName,
            // New uploads create private songs by default (schema).
            songIsPublic: false,
            ...(firstCloudBinding
              ? {
                  // Match openSong: œuvre title above, unnamed single session below.
                  sessionTitle: '',
                  deckSongPartSiblings: [
                    { id: presign.songPartId, name: null },
                  ],
                }
              : {}),
          }
        : {}),
    })
    patchTrack(trackId, { cloudTrackId: presign.trackAssetId })
    // Metronome may have been created before any SongPart existed — sync BPM now.
    void import('./sessionActions.client').then((mod) => {
      mod.flushMetronomeBpmToCloud()
    })

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
      cloudOwnedByMe: true,
      uploadedByPseudo: cloudUserPseudo,
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
  if (!canContributeCloudTracks()) return
  const { autoCloudSave } = useSessionStore.getState()
  if (!autoCloudSave) return
  await uploadTrackToCloud(trackId, { quietIfUnauthorized: true })
}

/**
 * Fill the deck breadcrumb with where a new home-deck recording will be saved
 * (most recently used repertoire), before any song exists yet.
 */
export async function ensurePendingDeckLibraryPath(): Promise<void> {
  if (!cloudSignedIn || !cloudUserPseudo) return
  const state = useSessionStore.getState()
  if (state.deckSongPartId || state.deckLibraryPath || state.readOnlySession) {
    return
  }

  try {
    const res = await fetch('/api/cloud/library?destination=1')
    const data = (await res.json()) as
      | {
          ok: true
          destination: {
            ownerPseudo: string
            groupId: string
            groupName: string
            repertoireId: string
            repertoireName: string
          }
        }
      | { ok: false; reason: string }
    if (!data.ok) return

    const now = useSessionStore.getState()
    if (now.deckSongPartId || now.deckLibraryPath || now.readOnlySession) {
      return
    }
    now.patch({
      deckLibraryPath: {
        ownerPseudo: data.destination.ownerPseudo,
        groupId: data.destination.groupId,
        groupName: data.destination.groupName,
        repertoireId: data.destination.repertoireId,
        repertoireName: data.destination.repertoireName,
        songId: '',
        songName: '',
      },
    })
  } catch (error) {
    console.error('[cloud] ensurePendingDeckLibraryPath failed', error)
  }
}

/** Upload every local (unsynced) take, in deck order. */
export async function uploadAllLocalTracks(): Promise<{
  uploaded: number
  failed: number
}> {
  if (!cloudSignedIn) return { uploaded: 0, failed: 0 }
  if (!canContributeCloudTracks()) return { uploaded: 0, failed: 0 }
  const localIds = useSessionStore
    .getState()
    .tracks.filter(
      (track) =>
        !track.isMetronome &&
        track.blob.size > 0 &&
        (track.cloudStatus === 'local' ||
          track.cloudStatus === 'error' ||
          track.cloudStatus == null),
    )
    .map((track) => track.id)

  let uploaded = 0
  let failed = 0
  for (const id of localIds) {
    const ok = await uploadTrackToCloud(id, { quietIfUnauthorized: true })
    if (ok) uploaded += 1
    else failed += 1
  }
  return { uploaded, failed }
}

export type OpenedCloudRemoteTrack = {
  id: string
  name: string
  url: string
  durationMs: number
  offsetMs: number
  volume: number
  muted: boolean
  muteRanges?: Array<{ startMs: number; endMs: number }>
  contentType: string
  uploadedByMe: boolean
  uploadedByPseudo: string | null
}

export type OpenedCloudSong = {
  song: {
    id: string
    name: string
    repertoireId: string
    isPublic: boolean
    allowsCollaboration: boolean
    groupId: string
    groupName: string
    repertoireName: string
    ownerPseudo: string | null
  }
  part: {
    id: string
    name: string | null
    masterVolume: number
    autoAlignEnabled: boolean
    showCalageWarnings: boolean
    skipCountInPlayback: boolean
    skipCountInDownload: boolean
    metronomeBpm: number | null
    metronomeVolume: number
  }
  /** Every session of the song, in library order (deck prev / next). */
  siblings: Array<{ id: string; name: string | null }>
  /** Track metadata + download URLs (blobs fetched separately). */
  remoteTracks: OpenedCloudRemoteTrack[]
  isOwner: boolean
  canCollaborate: boolean
}

/** Fetch song/session metadata + presigned URLs (no audio download yet). */
export async function fetchAndHydrateSong(
  songPartId: string,
  options?: { quiet?: boolean },
): Promise<OpenedCloudSong | null> {
  let res: Response
  try {
    res = await fetch('/api/cloud/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: 'openSong', songPartId }),
    })
  } catch {
    if (!options?.quiet) {
      useSessionStore.getState().setError(
        typeof navigator !== 'undefined' && navigator.onLine === false
          ? t('cloud.error.openOffline')
          : t('cloud.error.openFailed'),
      )
    }
    return null
  }

  let data:
    | {
        ok: true
        isOwner: boolean
        canCollaborate: boolean
        song: OpenedCloudSong['song']
        part: {
          id: string
          name: string | null
          masterVolume: number
          autoAlignEnabled: boolean
          showCalageWarnings: boolean
          skipCountInPlayback: boolean
          skipCountInDownload: boolean
          metronomeBpm?: number | null
          metronomeVolume?: number
        }
        siblings: Array<{ id: string; name: string | null }>
        tracks: OpenedCloudRemoteTrack[]
      }
    | { ok: false; reason: string }

  try {
    data = (await res.json()) as typeof data
  } catch {
    if (!options?.quiet) {
      useSessionStore.getState().setError(t('cloud.error.openFailed'))
    }
    return null
  }

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

  const masterRaw = Number(data.part.masterVolume)
  const masterVolume = Number.isFinite(masterRaw)
    ? Math.min(2, Math.max(0, masterRaw))
    : 1

  return {
    song: data.song,
    part: {
      ...data.part,
      masterVolume,
      autoAlignEnabled: data.part.autoAlignEnabled !== false,
      showCalageWarnings: data.part.showCalageWarnings !== false,
      skipCountInPlayback: data.part.skipCountInPlayback !== false,
      skipCountInDownload: data.part.skipCountInDownload !== false,
      metronomeBpm:
        typeof data.part.metronomeBpm === 'number' &&
        Number.isFinite(data.part.metronomeBpm)
          ? Math.round(data.part.metronomeBpm)
          : null,
      metronomeVolume: (() => {
        const raw = Number(data.part.metronomeVolume)
        return Number.isFinite(raw) ? Math.min(2, Math.max(0, raw)) : 1
      })(),
    },
    siblings: data.siblings,
    remoteTracks: data.tracks,
    isOwner: data.isOwner,
    canCollaborate: Boolean(data.canCollaborate),
  }
}

/** Download a remote track blob; optional 0–1 progress via Content-Length. */
export async function fetchRemoteTrackBlob(
  url: string,
  onProgress?: (ratio: number) => void,
): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`track download failed (${response.status})`)
  }
  const total = Number(response.headers.get('content-length')) || 0
  const contentType = response.headers.get('content-type') || 'audio/webm'
  if (!response.body || total <= 0) {
    const blob = await response.blob()
    onProgress?.(1)
    return blob
  }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      received += value.byteLength
      onProgress?.(Math.min(1, received / total))
    }
  }
  onProgress?.(1)
  // BlobPart accepts BufferSource; concatenate for a single Blob.
  const merged = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new Blob([merged], { type: contentType })
}
