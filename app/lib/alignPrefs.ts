/** User defaults for new projects: count-in / auto-align (client-only). */

export type AlignPrefs = {
  autoAlignEnabled: boolean
  showCalageWarnings: boolean
  skipCountInPlayback: boolean
  skipCountInDownload: boolean
}

const DEFAULTS: AlignPrefs = {
  autoAlignEnabled: true,
  showCalageWarnings: true,
  skipCountInPlayback: true,
  skipCountInDownload: true,
}

const AUTO_ALIGN_KEY = 'polyrecorder-auto-align'
const SHOW_WARNINGS_KEY = 'polyrecorder-show-calage-warnings'
const SKIP_PLAY_KEY = 'polyrecorder-skip-count-in-playback'
const SKIP_DOWNLOAD_KEY = 'polyrecorder-skip-count-in-download'

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key)
    if (raw === '0' || raw === 'false') return false
    if (raw === '1' || raw === 'true') return true
  } catch {
    // ignore
  }
  return fallback
}

function writeFlag(key: string, on: boolean): void {
  try {
    localStorage.setItem(key, on ? '1' : '0')
  } catch {
    // ignore
  }
}

export function readAlignPrefs(): AlignPrefs {
  return {
    autoAlignEnabled: readFlag(AUTO_ALIGN_KEY, DEFAULTS.autoAlignEnabled),
    showCalageWarnings: readFlag(SHOW_WARNINGS_KEY, DEFAULTS.showCalageWarnings),
    skipCountInPlayback: readFlag(SKIP_PLAY_KEY, DEFAULTS.skipCountInPlayback),
    skipCountInDownload: readFlag(SKIP_DOWNLOAD_KEY, DEFAULTS.skipCountInDownload),
  }
}

export function writeAutoAlignEnabled(on: boolean): void {
  writeFlag(AUTO_ALIGN_KEY, on)
}

export function writeShowCalageWarnings(on: boolean): void {
  writeFlag(SHOW_WARNINGS_KEY, on)
}

export function writeSkipCountInPlayback(on: boolean): void {
  writeFlag(SKIP_PLAY_KEY, on)
}

export function writeSkipCountInDownload(on: boolean): void {
  writeFlag(SKIP_DOWNLOAD_KEY, on)
}

export function writeAlignPrefs(prefs: Partial<AlignPrefs>): void {
  if (prefs.autoAlignEnabled != null) {
    writeAutoAlignEnabled(prefs.autoAlignEnabled)
  }
  if (prefs.showCalageWarnings != null) {
    writeShowCalageWarnings(prefs.showCalageWarnings)
  }
  if (prefs.skipCountInPlayback != null) {
    writeSkipCountInPlayback(prefs.skipCountInPlayback)
  }
  if (prefs.skipCountInDownload != null) {
    writeSkipCountInDownload(prefs.skipCountInDownload)
  }
}

/** @deprecated Prefer readAlignPrefs().autoAlignEnabled */
export function readAutoAlignEnabled(): boolean {
  return readAlignPrefs().autoAlignEnabled
}
