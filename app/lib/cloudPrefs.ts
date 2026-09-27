/** localStorage keys for cloud upload preferences (client-only). */

const AUTO_CLOUD_SAVE_KEY = 'polyrecorder-auto-cloud-save'
const ACTIVE_SONG_PART_KEY = 'polyrecorder-active-song-part-id'
/** Pre-SongPart key: the stored id already was a session (part) id. */
const LEGACY_ACTIVE_SONG_KEY = 'polyrecorder-active-song-id'

export function readAutoCloudSave(): boolean {
  try {
    const raw = localStorage.getItem(AUTO_CLOUD_SAVE_KEY)
    if (raw === '0' || raw === 'false') return false
    if (raw === '1' || raw === 'true') return true
  } catch {
    // ignore
  }
  return true
}

export function writeAutoCloudSave(on: boolean): void {
  try {
    localStorage.setItem(AUTO_CLOUD_SAVE_KEY, on ? '1' : '0')
  } catch {
    // ignore
  }
}

export function readActiveSongPartId(): string | null {
  try {
    return (
      localStorage.getItem(ACTIVE_SONG_PART_KEY) ??
      localStorage.getItem(LEGACY_ACTIVE_SONG_KEY)
    )
  } catch {
    return null
  }
}

export function writeActiveSongPartId(songPartId: string | null): void {
  try {
    localStorage.removeItem(LEGACY_ACTIVE_SONG_KEY)
    if (songPartId) localStorage.setItem(ACTIVE_SONG_PART_KEY, songPartId)
    else localStorage.removeItem(ACTIVE_SONG_PART_KEY)
  } catch {
    // ignore
  }
}
