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
  if (track.cloudStatus === 'uploading' || track.cloudStatus === 'synced') {
    return track.cloudStatus === 'synced'
  }

  patchTrack(trackId, { cloudStatus: 'uploading' })

  try {
    // Store only — never fall back to localStorage (stale ids must not attach).
    const songPartId = useSessionStore.getState().activeSongPartId
    const sessionTitle = useSessionStore.getState().sessionTitle
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
  }
  /** Every session of the song, in library order (deck prev / next). */
  siblings: Array<{ id: string; name: string | null }>
  tracks: Track[]
  /** Local track id → mix volume (from cloud). */
  trackVolumes: Record<number, number>
  /** Local track ids that are audible (not muted in cloud). */
  enabledTrackIds: number[]
  isOwner: boolean
  canCollaborate: boolean
}

export async function fetchAndHydrateSong(
  songPartId: string,
  options?: { quiet?: boolean },
): Promise<OpenedCloudSong | null> {
  const res = await fetch('/api/cloud/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent: 'openSong', songPartId }),
  })
  const data = (await res.json()) as
    | {
        ok: true
        isOwner: boolean
        canCollaborate: boolean
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
        }
        siblings: Array<{ id: string; name: string | null }>
        tracks: Array<{
          id: string
          name: string
          url: string
          durationMs: number
          offsetMs: number
          volume: number
          muted: boolean
          contentType: string
          uploadedByMe: boolean
          uploadedByPseudo: string | null
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
  const trackVolumes: Record<number, number> = {}
  const enabledTrackIds: number[] = []
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
      cloudOwnedByMe: Boolean(remote.uploadedByMe),
      uploadedByPseudo: remote.uploadedByPseudo,
    })
    const vol = Number(remote.volume)
    trackVolumes[counter] = Number.isFinite(vol)
      ? Math.min(1.5, Math.max(0, vol))
      : 1
    if (!remote.muted) enabledTrackIds.push(counter)
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
    },
    siblings: data.siblings,
    tracks,
    trackVolumes,
    enabledTrackIds,
    isOwner: data.isOwner,
    canCollaborate: Boolean(data.canCollaborate),
  }
}
