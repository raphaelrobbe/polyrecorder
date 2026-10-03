import type { Track } from '../../common/types'
import { decodeTrack } from '../audio/mix.client'
import { getPlaybackSources } from '../audio/runtime.client'
import { audibleMixRange } from '../audio/segments.client'
import { t } from '../i18n'
import {
  persistCloudTrackOffset,
} from './cloudPersist.client'
import { mergeTimelinePieces } from './cut.client'
import { scheduleGuestDraftSave } from './guest.client'
import {
  dismissNotice,
  refreshSkewWarning,
  setCalageMode,
  setCutMode,
  setError,
  showNotice,
} from './modes.client'
import {
  seekMixTo,
  stopPlayback,
  withMixTransportPreserved,
} from './playback.client'
import {
  CONTENT_SYNC_SIMPLE_OFFER_MS,
  get,
  getContentSyncSimpleOfferTimer,
  patch,
  PUNCH_IN_POSITION_MS,
  setContentSyncSimpleOfferTimer,
} from './state.client'
import { deleteTrack, renameTrack, setTrackEnabled } from './tracks.client'
import { scheduleMixPeakRefresh } from './volumes.client'

export function applyManualTrackOffset(trackId: number, offsetMs: number) {
  const invite = get().contentSyncInvite
  if (
    invite &&
    trackId === invite.fromTrackId &&
    invite.step !== 'merging' &&
    invite.step !== 'listenMerge' &&
    invite.step !== 'acceptMerge'
  ) {
    void applyContentSyncFocusOffset(trackId, offsetMs)
    return
  }
  void withMixTransportPreserved(() => {
    commitTrackOffsetMs(trackId, offsetMs)
  })
}

function commitTrackOffsetMs(trackId: number, offsetMs: number) {
  const tracks = get().tracks.map((track) =>
    track.id === trackId ? { ...track, offsetMs } : track,
  )
  const trackAlignDetails = { ...get().trackAlignDetails }
  delete trackAlignDetails[trackId]
  const alignAttentionByTrackId = { ...get().alignAttentionByTrackId }
  delete alignAttentionByTrackId[trackId]
  patch({ tracks, trackAlignDetails, alignAttentionByTrackId })
  refreshSkewWarning()
  persistCloudTrackOffset(trackId)
  scheduleGuestDraftSave()
  scheduleMixPeakRefresh()
}

/**
 * During the post-Sync invite flow: nudge the focus take, jump playback to
 * its start, and show “Satisfait du calage ?” immediately.
 */
async function applyContentSyncFocusOffset(
  trackId: number,
  offsetMs: number,
): Promise<void> {
  const invite = get().contentSyncInvite
  if (!invite || invite.fromTrackId !== trackId) return

  commitTrackOffsetMs(trackId, offsetMs)
  setCalageMode(true)
  patchContentSyncInvite({
    step: 'satisfied',
    afterManualAdjust: true,
  })

  const from = get().tracks.find((track) => track.id === trackId)
  if (!from) return
  const startMs = audibleMixRange(from).startMs
  try {
    setError(null)
    await seekMixTo(startMs)
  } catch {
    // seekMixTo already sets error
  }
}

/** Tracks that can show / use content Sync (punch-in or delayed start). */
export function trackOffersContentSync(track: Track): boolean {
  if (track.isMetronome) return false
  if (track.punchIn) return true
  return track.offsetMs > PUNCH_IN_POSITION_MS
}

export function armSimpleContentSyncOffer() {
  const pending = getContentSyncSimpleOfferTimer()
  if (pending) {
    clearTimeout(pending)
    setContentSyncSimpleOfferTimer(null)
  }
  const until = Date.now() + CONTENT_SYNC_SIMPLE_OFFER_MS
  patch({ contentSyncSimpleOfferUntil: until })
  setContentSyncSimpleOfferTimer(
    setTimeout(() => {
      setContentSyncSimpleOfferTimer(null)
      if (get().contentSyncSimpleOfferUntil !== until) return
      patch({ contentSyncSimpleOfferUntil: 0 })
    }, CONTENT_SYNC_SIMPLE_OFFER_MS),
  )
}

export function clearSimpleContentSyncOffer() {
  const pending = getContentSyncSimpleOfferTimer()
  if (pending) {
    clearTimeout(pending)
    setContentSyncSimpleOfferTimer(null)
  }
  if (get().contentSyncSimpleOfferUntil !== 0) {
    patch({ contentSyncSimpleOfferUntil: 0 })
  }
}

export function beginContentSyncPick(trackId: number) {
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track || !trackOffersContentSync(track)) return
  const current = get().contentSyncPickFromId
  if (current === trackId) {
    patch({ contentSyncPickFromId: null })
    return
  }
  patch({ contentSyncPickFromId: trackId, referencePickActive: false })
}

export function cancelContentSyncPick() {
  if (get().contentSyncPickFromId == null) return
  patch({ contentSyncPickFromId: null })
}

/**
 * Align a punch-in take against another track via onset NCC (±500 ms).
 * Call when the user picks the target while contentSyncPickFromId is set.
 */
export async function completeContentSyncAgainst(
  againstTrackId: number,
): Promise<void> {
  const fromId = get().contentSyncPickFromId
  if (fromId == null) return
  if (againstTrackId === fromId) return

  const from = get().tracks.find((t) => t.id === fromId)
  const against = get().tracks.find((t) => t.id === againstTrackId)
  if (!from || !against || against.isMetronome) {
    cancelContentSyncPick()
    return
  }

  patch({ contentSyncPickFromId: null })
  setError(null)
  const previousOffsetMs = from.offsetMs

  try {
    const [{ refineOffsetByOverlap }, bufFrom, bufAgainst] = await Promise.all([
      import('../audio/overlapAlign.client'),
      decodeTrack(from),
      decodeTrack(against),
    ])
    const refined = refineOffsetByOverlap(
      bufAgainst,
      bufFrom,
      from.offsetMs,
    )
    if (!refined) {
      showNotice({
        id: `content-sync-weak-${fromId}`,
        message: t('tracks.contentSync.weak'),
        tone: 'align',
      })
      return
    }
    // Commit offset without transport-preserve resume — that would race the
    // invite’s immediate listen-from-punch-in seek and skew playback hard.
    const hasSources =
      getPlaybackSources().length > 0 || get().playingTrackIds.length > 0
    if (hasSources) stopPlayback({ resetSeek: false })
    commitTrackOffsetMs(fromId, Math.round(refined.offsetMs))
    beginContentSyncInvite({
      fromTrackId: fromId,
      againstTrackId,
      previousOffsetMs,
      keepName: against.name,
    })
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : t('tracks.contentSync.failed'),
    )
  }
}

function patchContentSyncInvite(
  partial: Partial<import('../../store/sessionStore').ContentSyncInvite>,
) {
  const current = get().contentSyncInvite
  if (!current) return
  patch({ contentSyncInvite: { ...current, ...partial } })
}

function beginContentSyncInvite(options: {
  fromTrackId: number
  againstTrackId: number
  previousOffsetMs: number
  keepName: string
}) {
  dismissNotice()
  // Stay in the current mode (often simple): manual ± only after “Non”.
  patch({
    contentSyncInvite: {
      step: 'satisfied',
      fromTrackId: options.fromTrackId,
      againstTrackId: options.againstTrackId,
      previousOffsetMs: options.previousOffsetMs,
      cutPointMs: null,
      mergedTrackId: null,
      keepName: options.keepName,
      afterManualAdjust: false,
    },
  })
  void seekContentSyncInviteFocus()
}

async function seekContentSyncInviteFocus(): Promise<boolean> {
  const invite = get().contentSyncInvite
  if (!invite) return false
  const from = get().tracks.find((t) => t.id === invite.fromTrackId)
  if (!from) {
    dismissContentSyncInvite()
    return false
  }
  const startMs = audibleMixRange(from).startMs
  try {
    setError(null)
    await seekMixTo(startMs)
    return true
  } catch {
    // seekMixTo already sets error
    return false
  }
}

/** Close the post-Sync invite; optionally discard an unaccepted merge. */
export function dismissContentSyncInvite() {
  const invite = get().contentSyncInvite
  if (!invite) return

  const { mergedTrackId, againstTrackId, fromTrackId, step } = invite
  patch({ contentSyncInvite: null })

  if (
    mergedTrackId != null &&
    (step === 'listenMerge' ||
      step === 'acceptMerge' ||
      step === 'merging')
  ) {
    // Unaccepted merge → drop it and restore sources.
    if (get().tracks.some((t) => t.id === mergedTrackId)) {
      deleteTrack(mergedTrackId)
    }
    setTrackEnabled(againstTrackId, true)
    setTrackEnabled(fromTrackId, true)
  }
}

export async function contentSyncInviteListenSync(): Promise<void> {
  const invite = get().contentSyncInvite
  if (!invite) return
  if (invite.step !== 'listenSync' && invite.step !== 'satisfied') return
  if (invite.step === 'satisfied' && invite.afterManualAdjust) return

  const ok = await seekContentSyncInviteFocus()
  if (!ok) return
  if (invite.step === 'listenSync') {
    patchContentSyncInvite({ step: 'satisfied', afterManualAdjust: false })
  }
}

/**
 * After rejecting auto-Sync: stay in (or enter) Calage, nudge by hand, then
 * listen again — merge invite still follows if satisfied.
 */
export async function contentSyncInviteListenAdjust(): Promise<void> {
  const invite = get().contentSyncInvite
  if (!invite) return
  if (invite.step !== 'adjustListen' && invite.step !== 'satisfied') return
  if (invite.step === 'satisfied' && !invite.afterManualAdjust) return

  const ok = await seekContentSyncInviteFocus()
  if (!ok) return
  if (invite.step === 'adjustListen') {
    patchContentSyncInvite({ step: 'satisfied', afterManualAdjust: true })
  }
}

/** Replay the sync focus take from its start (Satisfait… → Réécouter). */
export async function contentSyncInviteRelisten(): Promise<void> {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'satisfied') return
  if (invite.afterManualAdjust) {
    await contentSyncInviteListenAdjust()
  } else {
    await contentSyncInviteListenSync()
  }
}

export function contentSyncInviteSatisfied(yes: boolean) {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'satisfied') return

  if (yes) {
    patchContentSyncInvite({ step: 'mergeAsk' })
    return
  }

  // Keep the current offset as a base for ± ms nudges; open Calage and
  // continue the invite flow (listen → merge) instead of sending to Découpage.
  setCalageMode(true)
  patchContentSyncInvite({
    step: 'adjustListen',
    afterManualAdjust: true,
  })
}

export function contentSyncInviteMergeAsk(yes: boolean) {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'mergeAsk') return

  if (!yes) {
    patchContentSyncInvite({ step: 'goCut' })
    return
  }

  void runContentSyncSilenceMerge()
}

export function contentSyncInviteGoCut() {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'goCut') return
  patch({ contentSyncInvite: null })
  setCutMode(true)
}

async function runContentSyncSilenceMerge(): Promise<void> {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'mergeAsk') return

  const against = get().tracks.find((t) => t.id === invite.againstTrackId)
  const from = get().tracks.find((t) => t.id === invite.fromTrackId)
  if (!against || !from) {
    dismissContentSyncInvite()
    return
  }

  patchContentSyncInvite({ step: 'merging' })
  setError(null)

  try {
    const [{ findQuietestOverlapCutMs }, bufAgainst, bufFrom] =
      await Promise.all([
        import('../audio/silenceCut.client'),
        decodeTrack(against),
        decodeTrack(from),
      ])

    // Fresh offsets after Sync.
    const againstNow = get().tracks.find((t) => t.id === invite.againstTrackId)
    const fromNow = get().tracks.find((t) => t.id === invite.fromTrackId)
    if (!againstNow || !fromNow) {
      dismissContentSyncInvite()
      return
    }

    const cutPointMs = findQuietestOverlapCutMs(
      {
        buffer: bufAgainst,
        offsetMs: againstNow.offsetMs,
        durationMs: againstNow.durationMs,
      },
      {
        buffer: bufFrom,
        offsetMs: fromNow.offsetMs,
        durationMs: fromNow.durationMs,
      },
    )

    if (cutPointMs == null) {
      setError(t('tracks.contentSync.invite.mergeNoSilence'))
      patchContentSyncInvite({ step: 'goCut' })
      return
    }

    const rangeAgainst = audibleMixRange(againstNow)
    const rangeFrom = audibleMixRange(fromNow)
    if (
      !(cutPointMs > rangeAgainst.startMs + 20) ||
      !(cutPointMs < rangeFrom.endMs - 20)
    ) {
      setError(t('tracks.contentSync.invite.mergeNoSilence'))
      patchContentSyncInvite({ step: 'goCut' })
      return
    }

    const pieces = [
      {
        track: againstNow,
        startMs: rangeAgainst.startMs,
        endMs: cutPointMs,
      },
      {
        track: fromNow,
        startMs: cutPointMs,
        endMs: rangeFrom.endMs,
      },
    ]

    const merged = await mergeTimelinePieces(pieces, {
      name: t('cut.merge.trackName', {
        names: `${againstNow.name} + ${fromNow.name}`,
      }),
      updateCutWork: false,
    })

    if (!merged) {
      // mergeTimelinePieces already sets error / re-enables sources
      patchContentSyncInvite({ step: 'goCut' })
      return
    }

    patchContentSyncInvite({
      step: 'listenMerge',
      cutPointMs,
      mergedTrackId: merged.id,
    })
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : t('tracks.contentSync.invite.mergeFailed'),
    )
    patchContentSyncInvite({ step: 'goCut' })
  }
}

export async function contentSyncInviteListenMerge(): Promise<void> {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'listenMerge') return
  if (invite.cutPointMs == null || invite.mergedTrackId == null) return

  const startMs = Math.max(0, invite.cutPointMs - 2000)
  try {
    setError(null)
    void seekMixTo(startMs)
  } catch {
    // seekMixTo already sets error
  }

  patchContentSyncInvite({ step: 'acceptMerge' })
}

export function contentSyncInviteAcceptMerge(yes: boolean) {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'acceptMerge') return

  const { mergedTrackId, againstTrackId, fromTrackId, keepName } = invite
  if (mergedTrackId == null) {
    patch({ contentSyncInvite: null })
    return
  }

  if (!yes) {
    // Clear merge refs first so deleteTrack doesn’t wipe the whole invite.
    patchContentSyncInvite({
      step: 'goCut',
      mergedTrackId: null,
      cutPointMs: null,
    })
    deleteTrack(mergedTrackId)
    setTrackEnabled(againstTrackId, true)
    setTrackEnabled(fromTrackId, true)
    return
  }

  // Keep merge: rename to first track, delete sources.
  renameTrack(mergedTrackId, keepName)
  patch({ contentSyncInvite: null })
  if (againstTrackId !== mergedTrackId) deleteTrack(againstTrackId)
  if (fromTrackId !== mergedTrackId) deleteTrack(fromTrackId)
  setTrackEnabled(mergedTrackId, true)
  scheduleGuestDraftSave()
}
