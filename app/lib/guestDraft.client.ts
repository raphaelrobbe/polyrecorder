/**
 * Guest-session drafts in IndexedDB (never uploaded while signed out).
 * Each browser tab owns a draftId in sessionStorage; IDB is shared across tabs.
 */

import type { Track, TrackCloudStatus } from '../common/types'

const DB_NAME = 'polyrecorder-guest-drafts'
const DB_VERSION = 1
const STORE = 'drafts'
const TAB_DRAFT_KEY = 'polyrecorder-guest-draft-id'
/** Keep unused drafts for a week. */
export const GUEST_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type GuestDraftTrack = {
  id: number
  name: string
  offsetMs: number
  durationMs: number
  mimeType: string
  blob: Blob
  volume: number
  enabled: boolean
  muteRanges?: Array<{ startMs: number; endMs: number }>
  cloudStatus?: TrackCloudStatus
  cloudTrackId?: string
  cloudOwnedByMe?: boolean
  uploadedByPseudo?: string | null
  isMetronome?: boolean
}

export type GuestDraftLibraryPath = {
  ownerPseudo: string
  groupId: string
  groupName: string
  repertoireId: string
  repertoireName: string
  songId: string
  songName: string
}

export type GuestDraft = {
  id: string
  updatedAt: number
  sessionTitle: string
  autoAlignEnabled: boolean
  showCalageWarnings: boolean
  skipCountInPlayback: boolean
  skipCountInDownload: boolean
  referenceTrackId: number | null
  trackCounter: number
  masterVolume: number
  metronomeBpm: number | null
  tracks: GuestDraftTrack[]
  /** Cloud session this draft was recorded against (consultation / collab). */
  cloudSongPartId: string | null
  cloudSongId: string | null
  deckSongPartSiblings: Array<{ id: string; name: string | null }>
  deckLibraryPath: GuestDraftLibraryPath | null
  songWorkName: string | null
  sharedOwnerLabel: string | null
  readOnlySession: boolean
  /** Song-level collab flag (true even for signed-out viewers). */
  allowsCollaboration: boolean
}

export type GuestDraftSaveInput = {
  sessionTitle: string
  autoAlignEnabled: boolean
  showCalageWarnings: boolean
  skipCountInPlayback: boolean
  skipCountInDownload: boolean
  referenceTrackId: number | null
  trackCounter: number
  masterVolume: number
  metronomeBpm: number | null
  tracks: Track[]
  trackVolumes: Record<number, number>
  enabledTrackIds: number[]
  cloudSongPartId: string | null
  cloudSongId: string | null
  deckSongPartSiblings: Array<{ id: string; name: string | null }>
  deckLibraryPath: GuestDraftLibraryPath | null
  songWorkName: string | null
  sharedOwnerLabel: string | null
  readOnlySession: boolean
  allowsCollaboration: boolean
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () =>
      reject(request.error ?? new Error('indexedDB open failed'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
  })
}

function idbReq<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('indexedDB request failed'))
  })
}

function newDraftId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Stable per-tab draft id (survives same-tab navigations, not new tabs). */
export function getOrCreateTabDraftId(): string {
  if (typeof sessionStorage === 'undefined') return newDraftId()
  const existing = sessionStorage.getItem(TAB_DRAFT_KEY)
  if (existing) return existing
  const id = newDraftId()
  sessionStorage.setItem(TAB_DRAFT_KEY, id)
  return id
}

export function readTabDraftId(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem(TAB_DRAFT_KEY)
}

export async function listGuestDrafts(): Promise<GuestDraft[]> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const rows = await idbReq(store.getAll())
    db.close()
    return (rows as GuestDraft[]).filter(Boolean)
  } catch (error) {
    console.error('[guestDraft] list failed', error)
    return []
  }
}

export async function loadGuestDraft(
  id: string,
): Promise<GuestDraft | null> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readonly')
    const row = await idbReq(tx.objectStore(STORE).get(id))
    db.close()
    return (row as GuestDraft | undefined) ?? null
  } catch (error) {
    console.error('[guestDraft] load failed', error)
    return null
  }
}

export async function deleteGuestDraft(id: string): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    await idbReq(tx.objectStore(STORE).delete(id))
    db.close()
  } catch (error) {
    console.error('[guestDraft] delete failed', error)
  }
}

export async function purgeExpiredDrafts(
  ttlMs: number = GUEST_DRAFT_TTL_MS,
): Promise<void> {
  const cutoff = Date.now() - ttlMs
  const drafts = await listGuestDrafts()
  await Promise.all(
    drafts
      .filter((draft) => draft.updatedAt < cutoff)
      .map((draft) => deleteGuestDraft(draft.id)),
  )
}

/**
 * Pick draft for post-login restore: this tab’s draft if it has tracks,
 * otherwise the most recently updated non-empty draft.
 */
export async function pickGuestDraftToRestore(): Promise<GuestDraft | null> {
  await purgeExpiredDrafts()
  const drafts = (await listGuestDrafts()).filter(
    (draft) => draft.tracks.length > 0,
  )
  if (drafts.length === 0) return null

  const tabId =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(TAB_DRAFT_KEY)
      : null
  if (tabId) {
    const tabDraft = drafts.find((draft) => draft.id === tabId)
    if (tabDraft) return tabDraft
  }

  drafts.sort((a, b) => b.updatedAt - a.updatedAt)
  return drafts[0] ?? null
}

export type SaveGuestDraftResult =
  | { ok: true }
  | { ok: false; reason: 'quota' | 'error' }

/** Persist current guest deck under this tab’s draft id. */
export async function saveGuestDraft(
  input: GuestDraftSaveInput,
): Promise<SaveGuestDraftResult> {
  const id = getOrCreateTabDraftId()
  if (input.tracks.length === 0) {
    await deleteGuestDraft(id)
    return { ok: true }
  }

  const draft: GuestDraft = {
    id,
    updatedAt: Date.now(),
    sessionTitle: input.sessionTitle,
    autoAlignEnabled: input.autoAlignEnabled,
    showCalageWarnings: input.showCalageWarnings,
    skipCountInPlayback: input.skipCountInPlayback,
    skipCountInDownload: input.skipCountInDownload,
    referenceTrackId: input.referenceTrackId,
    trackCounter: input.trackCounter,
    masterVolume: input.masterVolume,
    metronomeBpm: input.metronomeBpm,
    cloudSongPartId: input.cloudSongPartId,
    cloudSongId: input.cloudSongId,
    deckSongPartSiblings: input.deckSongPartSiblings,
    deckLibraryPath: input.deckLibraryPath,
    songWorkName: input.songWorkName,
    sharedOwnerLabel: input.sharedOwnerLabel,
    readOnlySession: input.readOnlySession,
    allowsCollaboration: input.allowsCollaboration,
    tracks: input.tracks.map((track) => ({
      id: track.id,
      name: track.name,
      offsetMs: track.offsetMs,
      durationMs: track.durationMs,
      mimeType: track.blob.type || 'audio/webm',
      blob: track.blob,
      volume: input.trackVolumes[track.id] ?? 1,
      enabled: input.enabledTrackIds.includes(track.id),
      muteRanges: track.muteRanges,
      cloudStatus: track.cloudStatus,
      cloudTrackId: track.cloudTrackId,
      cloudOwnedByMe: track.cloudOwnedByMe,
      uploadedByPseudo: track.uploadedByPseudo,
      isMetronome: track.isMetronome,
    })),
  }

  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    await idbReq(tx.objectStore(STORE).put(draft))
    db.close()
    return { ok: true }
  } catch (error) {
    const name =
      error && typeof error === 'object' && 'name' in error
        ? String((error as { name: string }).name)
        : ''
    if (
      name === 'QuotaExceededError' ||
      (error instanceof DOMException && error.name === 'QuotaExceededError')
    ) {
      console.error('[guestDraft] quota exceeded', error)
      return { ok: false, reason: 'quota' }
    }
    console.error('[guestDraft] save failed', error)
    return { ok: false, reason: 'error' }
  }
}
