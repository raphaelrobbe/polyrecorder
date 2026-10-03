import type { TrackPlayhead } from '../../common/types'
import { useSessionStore, type SessionStoreState } from '../../store/sessionStore'

// --- Module-private live playback maps (not in Zustand) ---

export const trackGains = new Map<number, GainNode>()
export const trackPlayheads = new Map<number, TrackPlayhead>()

let playWaiters: Array<() => void> = []
let preferMimeType = ''
let pendingTakeOffsetMs = 0
/** When true, the take being finalized was a mid-mix punch-in. */
let pendingTakePunchIn = false
/** Mix playhead to restore when discarding the in-progress take. */
let pendingTakeRestartMs = 0
/** Mix position above this → punch-in / show content Sync. */
export const PUNCH_IN_POSITION_MS = 50
/** How long Sync stays visible in simple mode after a punch-in take. */
export const CONTENT_SYNC_SIMPLE_OFFER_MS = 10_000
let contentSyncSimpleOfferTimer: ReturnType<typeof setTimeout> | null = null
let mixEpochPerf: number | null = null
let mixTimelineStartCtx: number | null = null
let guestDraftSaveTimer: ReturnType<typeof setTimeout> | null = null

export function patch(partial: Partial<SessionStoreState>): void {
  useSessionStore.setState(partial)
}

export function get() {
  return useSessionStore.getState()
}

export function getPlayWaiters(): Array<() => void> {
  return playWaiters
}

export function setPlayWaiters(next: Array<() => void>): void {
  playWaiters = next
}

export function getPreferMimeType(): string {
  return preferMimeType
}

export function setPreferMimeType(next: string): void {
  preferMimeType = next
}

export function getPendingTakeOffsetMs(): number {
  return pendingTakeOffsetMs
}

export function setPendingTakeOffsetMs(next: number): void {
  pendingTakeOffsetMs = next
}

export function getPendingTakePunchIn(): boolean {
  return pendingTakePunchIn
}

export function setPendingTakePunchIn(next: boolean): void {
  pendingTakePunchIn = next
}

export function getPendingTakeRestartMs(): number {
  return pendingTakeRestartMs
}

export function setPendingTakeRestartMs(next: number): void {
  pendingTakeRestartMs = next
}

export function getContentSyncSimpleOfferTimer():
  | ReturnType<typeof setTimeout>
  | null {
  return contentSyncSimpleOfferTimer
}

export function setContentSyncSimpleOfferTimer(
  next: ReturnType<typeof setTimeout> | null,
): void {
  contentSyncSimpleOfferTimer = next
}

export function getMixEpochPerf(): number | null {
  return mixEpochPerf
}

export function setMixEpochPerf(next: number | null): void {
  mixEpochPerf = next
}

export function getMixTimelineStartCtx(): number | null {
  return mixTimelineStartCtx
}

export function setMixTimelineStartCtx(next: number | null): void {
  mixTimelineStartCtx = next
}

export function getGuestDraftSaveTimer():
  | ReturnType<typeof setTimeout>
  | null {
  return guestDraftSaveTimer
}

export function setGuestDraftSaveTimer(
  next: ReturnType<typeof setTimeout> | null,
): void {
  guestDraftSaveTimer = next
}
