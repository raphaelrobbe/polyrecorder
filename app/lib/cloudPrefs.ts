/** localStorage keys for cloud upload preferences (client-only). */

const AUTO_CLOUD_SAVE_KEY = 'polyrecorder-auto-cloud-save'
const ACTIVE_SONG_KEY = 'polyrecorder-active-song-id'

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

export function readActiveSongId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SONG_KEY)
  } catch {
    return null
  }
}

export function writeActiveSongId(songId: string | null): void {
  try {
    if (songId) localStorage.setItem(ACTIVE_SONG_KEY, songId)
    else localStorage.removeItem(ACTIVE_SONG_KEY)
  } catch {
    // ignore
  }
}
