import type { Track } from '../../common/types'
import { clearBufferCache } from '../audio/runtime.client'
import { DEFAULT_METRONOME_BPM } from '../audio/metronome.client'
import { writeActiveSongPartId } from '../cloudPrefs'
import { isCloudSignedIn, maybeAutoUploadTrack } from '../cloudUpload.client'
import {
  deleteGuestDraft,
  loadTabGuestDraft,
  pickGuestDraftToRestore,
  readTabDraftId,
  saveGuestDraft,
  type GuestDraft,
} from '../guestDraft.client'
import { t } from '../i18n'
import { evaluateReferenceBeat } from './align.client'
import { clearRefPeaks, updateSessionTimerDisplay } from './helpers.client'
import {
  flushMetronomeBpmToCloud,
  hydrateMetronomeFromBpm,
} from './metronome.client'
import { refreshSkewWarning } from './modes.client'
import {
  get,
  getGuestDraftSaveTimer,
  patch,
  setGuestDraftSaveTimer,
  trackGains,
  trackPlayheads,
} from './state.client'

const GUEST_PROMPT_DISMISSED_KEY = 'polyrecorder-guest-prompt-dismissed'

export function isGuestSignInPromptDismissed(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  try {
    return sessionStorage.getItem(GUEST_PROMPT_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

/** Hide the guest sign-in invite for the rest of this browser tab session. */
export function dismissGuestSignInPrompt(): void {
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(GUEST_PROMPT_DISMISSED_KEY, '1')
    } catch {
      // ignore
    }
  }
  patch({ guestSignInPrompt: false })
}

/** Debounced IndexedDB snapshot while signed out (never hits S3). */
export function scheduleGuestDraftSave(): void {
  if (typeof window === 'undefined') return
  if (isCloudSignedIn()) return
  const pending = getGuestDraftSaveTimer()
  if (pending) clearTimeout(pending)
  setGuestDraftSaveTimer(
    setTimeout(() => {
      setGuestDraftSaveTimer(null)
      void persistGuestDraftNow()
    }, 400),
  )
}

/** Flush any pending guest draft write (e.g. beforeunload). */
export function flushGuestDraftSave(): void {
  if (typeof window === 'undefined') return
  if (isCloudSignedIn()) return
  const pending = getGuestDraftSaveTimer()
  if (pending) {
    clearTimeout(pending)
    setGuestDraftSaveTimer(null)
  }
  void persistGuestDraftNow()
}

async function persistGuestDraftNow(): Promise<void> {
  if (isCloudSignedIn()) return
  const state = get()
  const result = await saveGuestDraft({
    sessionTitle: state.sessionTitle,
    autoAlignEnabled: state.autoAlignEnabled,
    showCalageWarnings: state.showCalageWarnings,
    skipCountInPlayback: state.skipCountInPlayback,
    skipCountInDownload: state.skipCountInDownload,
    referenceTrackId: state.referenceTrackId,
    trackCounter: state.trackCounter,
    masterVolume: state.masterVolume,
    metronomeBpm: state.metronomeBpm,
    tracks: state.tracks,
    trackVolumes: state.trackVolumes,
    enabledTrackIds: state.enabledTrackIds,
    cloudSongPartId: state.deckSongPartId,
    cloudSongId: state.deckSongId,
    deckSongPartSiblings: state.deckSongPartSiblings,
    deckLibraryPath: state.deckLibraryPath,
    songWorkName: state.songWorkName,
    sharedOwnerLabel: state.sharedOwnerLabel,
    readOnlySession: state.readOnlySession,
    allowsCollaboration: state.songAllowsCollaboration,
  })
  if (!result.ok && result.reason === 'quota') {
    patch({ hint: t('guestDraft.quota') })
  }
}

function applyGuestDraftToStore(draft: GuestDraft): void {
  for (const track of get().tracks) {
    URL.revokeObjectURL(track.url)
  }
  clearBufferCache()
  trackGains.clear()
  trackPlayheads.clear()

  const tracks: Track[] = draft.tracks.map((row) => ({
    id: row.id,
    name: row.name,
    blob: row.blob,
    url: URL.createObjectURL(row.blob),
    durationMs: row.durationMs,
    offsetMs: row.offsetMs,
    muteRanges: row.muteRanges,
    cloudStatus: row.cloudStatus ?? 'local',
    cloudTrackId: row.cloudTrackId,
    cloudOwnedByMe: row.cloudOwnedByMe,
    uploadedByPseudo: row.uploadedByPseudo,
    isMetronome: row.isMetronome,
  }))
  const trackVolumes: Record<number, number> = {}
  const enabledTrackIds: number[] = []
  for (const row of draft.tracks) {
    trackVolumes[row.id] = row.volume
    if (row.enabled) enabledTrackIds.push(row.id)
  }

  const cloudPartId = draft.cloudSongPartId
  const allowsCollab = Boolean(draft.allowsCollaboration && cloudPartId)
  const readOnly = Boolean(draft.readOnlySession || cloudPartId)
  const hasMetroTrack = tracks.some((track) => track.isMetronome)
  const resolvedMetronomeBpm =
    draft.metronomeBpm ??
    (hasMetroTrack ? DEFAULT_METRONOME_BPM : null)

  patch({
    tracks,
    trackCounter: Math.max(
      draft.trackCounter,
      ...tracks.map((track) => track.id),
      0,
    ),
    enabledTrackIds,
    playingTrackIds: [],
    highlightedTrackIds: [],
    referenceTrackId:
      draft.referenceTrackId != null &&
      tracks.some((track) => track.id === draft.referenceTrackId)
        ? draft.referenceTrackId
        : (tracks[0]?.id ?? null),
    trackAlignDetails: {},
    trackVolumes,
    masterVolume: draft.masterVolume ?? 1,
    sessionTitle: draft.sessionTitle,
    autoAlignEnabled: draft.autoAlignEnabled,
    showCalageWarnings: draft.showCalageWarnings,
    skipCountInPlayback: draft.skipCountInPlayback,
    skipCountInDownload: draft.skipCountInDownload,
    metronomeBpm: resolvedMetronomeBpm,
    activeSongPartId: null,
    alignAttentionByTrackId: {},
    deckSongPartId: cloudPartId,
    deckSongPartSiblings: draft.deckSongPartSiblings ?? [],
    deckSongId: draft.cloudSongId,
    readOnlySession: readOnly,
    canCloudContribute: false,
    songAllowsCollaboration: Boolean(draft.allowsCollaboration),
    deckLibraryPath: draft.deckLibraryPath,
    songWorkName: draft.songWorkName,
    songIsPublic: false,
    sharedOwnerLabel: draft.sharedOwnerLabel,
    calageMode: false,
    mixMode: readOnly && !allowsCollab,
    cutMode: false,
    cutPhase: 'idle',
    cutSelectedTrackIds: [],
    cutWorkSegments: {},
    mixSeekMs: 0,
    mixClockText: '00:00.000',
    error: null,
    notice: null,
    noticeSuppressedId: null,
    contentSyncInvite: null,
    referenceBeatDismissedKey: '',
  })
  clearRefPeaks()
  updateSessionTimerDisplay()
  refreshSkewWarning()
  // Ensure a virtual metro track exists when only the BPM was persisted.
  if (
    resolvedMetronomeBpm != null &&
    !tracks.some((track) => track.isMetronome)
  ) {
    void hydrateMetronomeFromBpm(resolvedMetronomeBpm).then(() => {
      if (get().tracks.length > 0) void evaluateReferenceBeat()
    })
    return
  }
  if (tracks.length > 0) void evaluateReferenceBeat()
}

/**
 * Guest boot / F5: restore this tab’s IndexedDB draft into an empty deck.
 * Only this tab’s draft — never another tab’s (emptied deck must stay empty).
 * (Sign-in restore stays in claimGuestDraftAfterSignIn.)
 */
export async function hydrateGuestDraftIfNeeded(): Promise<void> {
  if (isCloudSignedIn()) return
  if (get().tracks.length > 0) return
  const draft = await loadTabGuestDraft()
  if (!draft || draft.tracks.length === 0) return
  applyGuestDraftToStore(draft)
}

/**
 * After sign-in: reload the guest draft into memory (if the deck is empty),
 * re-arm collab contribute when applicable, then run the same post-take
 * path as appendTrackFromBlob (maybeAutoUploadTrack per local take).
 *
 * Concurrent callers share one in-flight run (remount / Strict Mode must not
 * start a second upload batch that would create another song).
 */
let guestClaimInFlight: Promise<void> | null = null

export function isGuestClaimInFlight(): boolean {
  return guestClaimInFlight != null
}

export async function claimGuestDraftAfterSignIn(): Promise<void> {
  if (!isCloudSignedIn()) return
  if (guestClaimInFlight) return guestClaimInFlight

  guestClaimInFlight = claimGuestDraftAfterSignInImpl().finally(() => {
    guestClaimInFlight = null
  })
  return guestClaimInFlight
}

async function claimGuestDraftAfterSignInImpl(): Promise<void> {
  if (!isCloudSignedIn()) return

  const deckHadTracks = get().tracks.length > 0
  let claimedDraftId: string | null = null

  if (!deckHadTracks) {
    const draft = await pickGuestDraftToRestore()
    if (!draft) return
    claimedDraftId = draft.id
    applyGuestDraftToStore(draft)
  } else {
    claimedDraftId = readTabDraftId()
  }

  // Signed-in collab session: contribute to the song part we overdubbed as guest.
  // Home guest takes: clear any stale localStorage target so upload creates a new song.
  const state = get()
  const songPartId = state.deckSongPartId
  if (
    state.readOnlySession &&
    state.songAllowsCollaboration &&
    songPartId
  ) {
    writeActiveSongPartId(songPartId)
    patch({
      activeSongPartId: songPartId,
      canCloudContribute: true,
    })
  } else if (!songPartId) {
    writeActiveSongPartId(null)
    patch({ activeSongPartId: null })
  }

  // Keep / restore virtual metronome after sign-in (not uploaded as audio).
  const metroBpm = get().metronomeBpm
  if (metroBpm != null && !get().tracks.some((track) => track.isMetronome)) {
    await hydrateMetronomeFromBpm(metroBpm)
  }

  const localIds = get()
    .tracks.filter(
      (track) =>
        !track.isMetronome &&
        track.blob.size > 0 &&
        (track.cloudStatus === 'local' ||
          track.cloudStatus === 'error' ||
          track.cloudStatus == null),
    )
    .map((track) => track.id)

  // Memory is the source of truth again; drop the IDB snapshot.
  if (claimedDraftId) await deleteGuestDraft(claimedDraftId)

  // Same gates as a take that just finished — one bound session for the whole batch.
  for (const id of localIds) {
    const bound = get().activeSongPartId
    if (bound) {
      writeActiveSongPartId(bound)
      patch({ activeSongPartId: bound, deckSongPartId: bound })
    }
    await maybeAutoUploadTrack(id)
  }

  // Persist tempo even when the only restore was the metronome, or uploads skipped.
  flushMetronomeBpmToCloud()
}
