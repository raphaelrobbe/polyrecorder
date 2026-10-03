import type { Track } from '../../common/types'
import { formatPseudoHandle } from '../../common/user'
import { clearTrackPeakCache } from '../audio/clipDetect.client'
import { TRACK_VOLUME_MAX } from '../audio/mix.client'
import {
  clearBufferCache,
  discardPendingRecording,
  getActiveRecording,
  setActiveRecording,
  stopMeterNodes,
} from '../audio/runtime.client'
import { writeActiveSongPartId } from '../cloudPrefs'
import {
  defaultSessionTitle,
  defaultTrackName,
  isDefaultSessionTitleAnyLocale,
  isDefaultTrackNameAnyLocale,
  LIBRARY_TITLE_MAX_LEN,
  normalizeSessionTitle,
  parseDefaultTrackIndex,
} from '../format'
import type { Locale } from '../i18n'
import { t } from '../i18n'
import { librarySessionPath } from '../libraryPaths'
import { evaluateReferenceBeat } from './align.client'
import { scheduleGuestDraftSave } from './guest.client'
import {
  clearRefPeaks,
  setTransportState,
  updateSessionTimerDisplay,
} from './helpers.client'
import { hydrateMetronomeFromBpm } from './metronome.client'
import { refreshSkewWarning, setError } from './modes.client'
import { stopPlayback } from './playback.client'
import { stopTimer } from './recording.client'
import { get, patch, trackGains, trackPlayheads } from './state.client'
import { clampTrackVolume, refreshTrackClipFlags } from './volumes.client'

/** Wipe the local deck and cloud session context (blank recording screen). */
export function clearLocalDeckSession(): void {
  cloudOpenGeneration += 1
  if (get().state === 'recording') {
    discardPendingRecording()
    const recording = getActiveRecording()
    setActiveRecording(null)
    if (recording && recording.recorder.state !== 'inactive') {
      try {
        recording.recorder.ondataavailable = null
        recording.recorder.onstop = null
        recording.recorder.stop()
      } catch {
        // Discarded take — ignore stop errors.
      }
    }
    stopTimer()
    stopMeterNodes()
    patch({ meterLevel: 0 })
    setTransportState('idle')
  }

  stopPlayback({ resetSeek: true })
  writeActiveSongPartId(null)
  for (const track of get().tracks) {
    URL.revokeObjectURL(track.url)
  }
  clearBufferCache()
  trackGains.clear()
  trackPlayheads.clear()
  clearTrackPeakCache()
  patch({
    tracks: [],
    enabledTrackIds: [],
    playingTrackIds: [],
    highlightedTrackIds: [],
    referenceTrackId: null,
    trackAlignDetails: {},
    alignAttentionByTrackId: {},
    trackClipById: {},
    mixPeakAtUnityMaster: null,
    mixClipWarning: false,
    trackVolumes: {},
    masterVolume: 1,
    trackCounter: 0,
    metronomeBpm: null,
    activeSongPartId: null,
    deckSongPartId: null,
    deckSongPartSiblings: [],
    deckSongId: null,
    readOnlySession: false,
    canCloudContribute: false,
    songAllowsCollaboration: false,
    deckLibraryPath: null,
    songWorkName: null,
    songIsPublic: false,
    sharedOwnerLabel: null,
    sessionTitle: defaultSessionTitle(),
    calageMode: false,
    mixMode: false,
    cutMode: false,
    cutPhase: 'idle',
    cutSelectedTrackIds: [],
    cutWorkSegments: {},
    mixSeekMs: 0,
    mixClockText: '00:00.000',
    error: null,
    notice: null,
    noticeSuppressedId: null,
    referenceBeatDismissedKey: '',
    hint: '',
    guestSignInPrompt: false,
  })
  clearRefPeaks()
  updateSessionTimerDisplay()
  refreshSkewWarning()
  void import('../cloudUpload.client').then((mod) => {
    void mod.ensurePendingDeckLibraryPath()
  })
}

/** Drop cloud song context and all loaded takes (e.g. on sign-out). */
export function resetDeckOnSignOut() {
  clearLocalDeckSession()
}

/** Replace the deck with tracks loaded from a cloud song part (session). */
let cloudOpenGeneration = 0

function finalizeDownloadedTrack(
  trackId: number,
  blob: Blob,
  generation: number,
) {
  if (generation !== cloudOpenGeneration) {
    return
  }
  const prev = get().tracks.find((t) => t.id === trackId)
  if (!prev?.downloadPending) return
  URL.revokeObjectURL(prev.url)
  clearBufferCache(trackId)
  const url = URL.createObjectURL(blob)
  patch({
    tracks: get().tracks.map((t) =>
      t.id === trackId
        ? {
            ...t,
            blob,
            url,
            downloadPending: undefined,
            downloadProgress: undefined,
            cloudStatus: 'synced' as const,
          }
        : t,
    ),
  })
  updateSessionTimerDisplay()
  void refreshTrackClipFlags()
  if (get().referenceTrackId === trackId) void evaluateReferenceBeat()
}

function patchTrackDownloadProgress(
  trackId: number,
  ratio: number,
  generation: number,
) {
  if (generation !== cloudOpenGeneration) return
  const clamped = Math.max(0, Math.min(1, ratio))
  patch({
    tracks: get().tracks.map((t) =>
      t.id === trackId && t.downloadPending
        ? { ...t, downloadProgress: clamped }
        : t,
    ),
  })
}

export async function loadCloudSongIntoSession(
  songPartId: string,
  options?: { quiet?: boolean; force?: boolean },
): Promise<boolean> {
  if (get().state === 'recording') return false

  // After a local take uploads, we navigate to /session/:id while the deck
  // already holds the audio. Don't wipe it into empty download stubs.
  const current = get()
  if (
    !options?.force &&
    current.deckSongPartId === songPartId &&
    current.tracks.some(
      (t) => !t.isMetronome && t.blob.size > 0 && !t.downloadPending,
    )
  ) {
    return true
  }

  const generation = ++cloudOpenGeneration
  const { fetchAndHydrateSong, fetchRemoteTrackBlob, writeActiveSongPartId } =
    await import('../cloudUpload.client')
  const opened = await fetchAndHydrateSong(songPartId, options)
  if (!opened || generation !== cloudOpenGeneration) return false

  stopPlayback({ resetSeek: true })
  for (const track of get().tracks) {
    URL.revokeObjectURL(track.url)
  }
  clearBufferCache()
  trackGains.clear()
  trackPlayheads.clear()
  clearTrackPeakCache()

  const empty = new Blob([], { type: 'audio/webm' })
  const tracks: Track[] = []
  const trackVolumes: Record<number, number> = {}
  const enabledTrackIds: number[] = []
  const downloadJobs: Array<{ localId: number; url: string }> = []

  let counter = 0
  for (const remote of opened.remoteTracks) {
    counter += 1
    const stubUrl = URL.createObjectURL(empty)
    tracks.push({
      id: counter,
      name: remote.name,
      blob: empty,
      url: stubUrl,
      durationMs: remote.durationMs,
      offsetMs: remote.offsetMs,
      muteRanges:
        Array.isArray(remote.muteRanges) && remote.muteRanges.length > 0
          ? remote.muteRanges
          : undefined,
      cloudStatus: 'synced',
      cloudTrackId: remote.id,
      cloudOwnedByMe: Boolean(remote.uploadedByMe),
      uploadedByPseudo: remote.uploadedByPseudo,
      downloadPending: true,
      downloadProgress: 0,
    })
    const vol = Number(remote.volume)
    trackVolumes[counter] = Number.isFinite(vol)
      ? Math.min(TRACK_VOLUME_MAX, Math.max(0, vol))
      : 1
    if (!remote.muted) enabledTrackIds.push(counter)
    downloadJobs.push({ localId: counter, url: remote.url })
  }

  const readOnly = !opened.isOwner
  const canCloudContribute = opened.canCollaborate
  if (opened.isOwner || canCloudContribute) {
    writeActiveSongPartId(opened.part.id)
  }

  const deckLibraryPath =
    opened.song.ownerPseudo && opened.song.groupId
      ? {
          ownerPseudo: opened.song.ownerPseudo,
          groupId: opened.song.groupId,
          groupName: opened.song.groupName,
          repertoireId: opened.song.repertoireId,
          repertoireName: opened.song.repertoireName,
          songId: opened.song.id,
          songName: opened.song.name,
        }
      : null
  const songWorkName = opened.song.name
  const sharedOwnerLabel = readOnly
    ? formatPseudoHandle(opened.song.ownerPseudo)
    : null

  patch({
    tracks,
    trackCounter: tracks.length,
    enabledTrackIds,
    playingTrackIds: [],
    highlightedTrackIds: [],
    referenceTrackId: tracks[0]?.id ?? null,
    trackAlignDetails: {},
    alignAttentionByTrackId: {},
    trackClipById: {},
    mixPeakAtUnityMaster: null,
    mixClipWarning: false,
    trackVolumes,
    masterVolume: opened.part.masterVolume,
    autoAlignEnabled: opened.part.autoAlignEnabled,
    showCalageWarnings: opened.part.showCalageWarnings,
    skipCountInPlayback: opened.part.skipCountInPlayback,
    skipCountInDownload: opened.part.skipCountInDownload,
    metronomeBpm: opened.part.metronomeBpm,
    sessionTitle: opened.part.name ?? '',
    activeSongPartId:
      opened.isOwner || canCloudContribute ? opened.part.id : null,
    deckSongPartId: opened.part.id,
    deckSongPartSiblings: opened.siblings,
    deckSongId: opened.song.id,
    readOnlySession: readOnly,
    canCloudContribute,
    songAllowsCollaboration: Boolean(opened.song.allowsCollaboration),
    deckLibraryPath,
    songWorkName,
    songIsPublic: Boolean(opened.song.isPublic),
    sharedOwnerLabel,
    calageMode: false,
    mixMode: readOnly && !canCloudContribute,
    cutMode: false,
    cutPhase: 'idle',
    cutSelectedTrackIds: [],
    cutWorkSegments: {},
    mixSeekMs: 0,
    mixClockText: '00:00.000',
    error: null,
    notice: null,
    noticeSuppressedId: null,
    ...(readOnly
      ? {
          referenceBeatDismissedKey: '',
          skewWarningDismissedKey: '',
        }
      : {}),
  })
  clearRefPeaks()
  updateSessionTimerDisplay()
  refreshSkewWarning()
  if (opened.part.metronomeBpm != null) {
    await hydrateMetronomeFromBpm(
      opened.part.metronomeBpm,
      opened.part.metronomeVolume ?? 1,
    )
  }

  // Download audio in parallel; deck UI is already showing stubs.
  void Promise.all(
    downloadJobs.map(async ({ localId, url }) => {
      try {
        const blob = await fetchRemoteTrackBlob(url, (ratio) => {
          patchTrackDownloadProgress(localId, ratio, generation)
        })
        finalizeDownloadedTrack(localId, blob, generation)
      } catch {
        if (generation !== cloudOpenGeneration) return
        // Keep the row but clear the busy bar so the user can retry / leave.
        patch({
          tracks: get().tracks.map((t) =>
            t.id === localId && t.downloadPending
              ? {
                  ...t,
                  downloadPending: undefined,
                  downloadProgress: undefined,
                  cloudStatus: 'error' as const,
                }
              : t,
          ),
        })
        if (!options?.quiet) {
          setError(t('cloud.error.openFailed'))
        }
      }
    }),
  )

  return generation === cloudOpenGeneration
}

/**
 * After a library mutation on a song (public / collab / …), refresh deck
 * metadata without re-downloading audio (avoids wiping local blobs).
 */
export async function refreshOpenDeckForSong(songId: string): Promise<void> {
  const { deckSongId, deckSongPartId, state } = get()
  if (!songId || deckSongId !== songId || !deckSongPartId) return
  if (state === 'recording') return
  const { fetchAndHydrateSong, writeActiveSongPartId } = await import(
    '../cloudUpload.client'
  )
  const opened = await fetchAndHydrateSong(deckSongPartId, { quiet: true })
  if (!opened || get().deckSongPartId !== deckSongPartId) return

  const readOnly = !opened.isOwner
  const canCloudContribute = opened.canCollaborate
  if (opened.isOwner || canCloudContribute) {
    writeActiveSongPartId(opened.part.id)
  }

  const deckLibraryPath =
    opened.song.ownerPseudo && opened.song.groupId
      ? {
          ownerPseudo: opened.song.ownerPseudo,
          groupId: opened.song.groupId,
          groupName: opened.song.groupName,
          repertoireId: opened.song.repertoireId,
          repertoireName: opened.song.repertoireName,
          songId: opened.song.id,
          songName: opened.song.name,
        }
      : get().deckLibraryPath

  patch({
    masterVolume: opened.part.masterVolume,
    autoAlignEnabled: opened.part.autoAlignEnabled,
    showCalageWarnings: opened.part.showCalageWarnings,
    skipCountInPlayback: opened.part.skipCountInPlayback,
    skipCountInDownload: opened.part.skipCountInDownload,
    metronomeBpm: opened.part.metronomeBpm,
    sessionTitle: opened.part.name ?? '',
    activeSongPartId:
      opened.isOwner || canCloudContribute ? opened.part.id : null,
    deckSongPartId: opened.part.id,
    deckSongPartSiblings: opened.siblings,
    deckSongId: opened.song.id,
    readOnlySession: readOnly,
    canCloudContribute,
    songAllowsCollaboration: Boolean(opened.song.allowsCollaboration),
    deckLibraryPath,
    songWorkName: opened.song.name,
    songIsPublic: Boolean(opened.song.isPublic),
    sharedOwnerLabel: readOnly
      ? formatPseudoHandle(opened.song.ownerPseudo)
      : null,
  })
  const metro = get().tracks.find((track) => track.isMetronome)
  if (metro && opened.part.metronomeBpm != null) {
    patch({
      trackVolumes: {
        ...get().trackVolumes,
        [metro.id]: clampTrackVolume(opened.part.metronomeVolume ?? 1),
      },
    })
  }
}

/** Home path for the current deck: `/session/:id` when a cloud session is loaded. */
export function getDeckHomePath(): string {
  const id = get().deckSongPartId
  return id ? librarySessionPath(id) : '/'
}

/**
 * If a cloud song part is the upload target but not loaded on the deck yet,
 * hydrate it (e.g. after refresh or closing the library).
 * Stale ids (deleted part, empty library) are cleared quietly.
 */
export async function hydrateActiveSongIfNeeded(): Promise<void> {
  const {
    activeSongPartId,
    deckSongPartId,
    state,
    readOnlySession,
    canCloudContribute,
  } = get()
  if (
    (readOnlySession && !canCloudContribute) ||
    !activeSongPartId ||
    activeSongPartId === deckSongPartId ||
    state === 'recording'
  ) {
    return
  }
  const ok = await loadCloudSongIntoSession(activeSongPartId, { quiet: true })
  if (!ok) {
    writeActiveSongPartId(null)
    patch({
      activeSongPartId: null,
      deckSongPartId: null,
      deckSongPartSiblings: [],
      deckSongId: null,
      canCloudContribute: false,
      deckLibraryPath: null,
      songWorkName: null,
      songIsPublic: false,
      error: null,
    })
  }
}

/**
 * When the browser comes back online: clear offline open errors, upload any
 * local takes (signed-in + auto-cloud), and reload a session that has no
 * playable audio yet (failed open / failed downloads).
 */
let resumeOnlineInFlight: Promise<boolean> | null = null

export async function resumeAfterNetworkOnline(
  options?: { songPartId?: string | null },
): Promise<boolean> {
  if (resumeOnlineInFlight) return resumeOnlineInFlight
  resumeOnlineInFlight = resumeAfterNetworkOnlineImpl(options).finally(() => {
    resumeOnlineInFlight = null
  })
  return resumeOnlineInFlight
}

async function resumeAfterNetworkOnlineImpl(
  options?: { songPartId?: string | null },
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false
  }
  if (get().state === 'recording') return false

  const offlineOpen = t('cloud.error.openOffline')
  if (get().error === offlineOpen) setError(null)

  const cloud = await import('../cloudUpload.client')
  if (cloud.isCloudSignedIn()) {
    await cloud.ensurePendingDeckLibraryPath()
    if (get().autoCloudSave) {
      await cloud.uploadAllLocalTracks()
    }
  }

  const partId = options?.songPartId ?? get().deckSongPartId
  if (!partId) return true

  const hasPlayable = get().tracks.some(
    (track) =>
      !track.isMetronome && track.blob.size > 0 && !track.downloadPending,
  )
  // Failed open / empty stubs only — never wipe local audio that already plays.
  if (!hasPlayable) {
    return loadCloudSongIntoSession(partId, { force: true, quiet: true })
  }
  return true
}


export function normalizeAndSetSessionTitle(raw: string) {
  const songPartId = get().activeSongPartId
  // Cloud sessions may be unnamed (null); local guest titles keep the default.
  const name =
    songPartId && !get().readOnlySession
      ? raw.replace(/\s+/g, ' ').trim().slice(0, LIBRARY_TITLE_MAX_LEN)
      : normalizeSessionTitle(raw)
  patch({ sessionTitle: name })
  scheduleGuestDraftSave()

  if (get().readOnlySession) return
  if (!songPartId) return

  void fetch('/api/cloud/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'rename',
      kind: 'songPart',
      id: songPartId,
      name,
    }),
  })
    .then(async (res) => {
      const data = (await res.json()) as { ok: boolean }
      if (!data.ok) {
        console.error('[cloud] failed to rename part from session title')
      }
    })
    .catch((error) => {
      console.error('[cloud] failed to rename part from session title', error)
    })
}

/** Rename the cloud song (œuvre) from the deck’s highlighted title. */
export function normalizeAndSetSongWorkName(raw: string) {
  const name = normalizeSessionTitle(raw)
  const path = get().deckLibraryPath
  patch({
    songWorkName: name,
    deckLibraryPath: path ? { ...path, songName: name } : null,
  })

  if (get().readOnlySession) return
  const songId = get().deckSongId
  if (!songId || !name) return

  void fetch('/api/cloud/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'rename',
      kind: 'song',
      id: songId,
      name,
    }),
  })
    .then(async (res) => {
      const data = (await res.json()) as { ok: boolean }
      if (!data.ok) {
        console.error('[cloud] failed to rename song from deck title')
      }
    })
    .catch((error) => {
      console.error('[cloud] failed to rename song from deck title', error)
    })
}

/**
 * Keep deck breadcrumb / titles in sync when the library renames a node
 * that belongs to the currently loaded session.
 */
export function syncDeckLabelsAfterLibraryRename(
  kind: 'group' | 'repertoire' | 'song' | 'songPart',
  id: string,
  name: string,
): void {
  const state = get()
  const path = state.deckLibraryPath

  if (kind === 'songPart') {
    const touchesDeck =
      id === state.deckSongPartId || id === state.activeSongPartId
    const touchesSibling = state.deckSongPartSiblings.some(
      (sibling) => sibling.id === id,
    )
    if (!touchesDeck && !touchesSibling) return
    patch({
      ...(touchesDeck ? { sessionTitle: name } : {}),
      ...(touchesSibling
        ? {
            deckSongPartSiblings: state.deckSongPartSiblings.map((sibling) =>
              sibling.id === id
                ? { ...sibling, name: name.trim() ? name : null }
                : sibling,
            ),
          }
        : {}),
    })
    return
  }

  if (!path) return
  if (kind === 'group' && path.groupId === id) {
    patch({ deckLibraryPath: { ...path, groupName: name } })
    return
  }
  if (kind === 'repertoire' && path.repertoireId === id) {
    patch({ deckLibraryPath: { ...path, repertoireName: name } })
    return
  }
  if (kind === 'song' && (path.songId === id || state.deckSongId === id)) {
    patch({
      songWorkName: name,
      deckLibraryPath: { ...path, songName: name },
    })
  }
}

/**
 * When the UI language changes, rewrite still-default titles / track names
 * into the new locale so italic + select-on-focus stay correct.
 */
export function rematerializeLocalizedDefaults(locale: Locale) {
  const { sessionTitle, tracks } = get()
  const nextTitle = isDefaultSessionTitleAnyLocale(sessionTitle)
    ? defaultSessionTitle(locale)
    : null
  let tracksChanged = false
  const nextTracks = tracks.map((track, index) => {
    if (!isDefaultTrackNameAnyLocale(track.name)) return track
    const parsed = parseDefaultTrackIndex(track.name)
    const trackIndex = parsed ?? index + 1
    const nextName = defaultTrackName(trackIndex, locale)
    if (nextName === track.name) return track
    tracksChanged = true
    return { ...track, name: nextName }
  })
  if (nextTitle == null && !tracksChanged) return
  patch({
    ...(nextTitle != null ? { sessionTitle: nextTitle } : {}),
    ...(tracksChanged ? { tracks: nextTracks } : {}),
  })
}
