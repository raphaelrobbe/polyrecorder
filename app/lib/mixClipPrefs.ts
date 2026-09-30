/**
 * Client prefs for automatic master-volume correction.
 * Migrates the legacy single `polyrecorder-auto-clip-correct` flag.
 */

const LEGACY_KEY = 'polyrecorder-auto-clip-correct'
const PREVENT_CLIP_KEY = 'polyrecorder-auto-master-prevent-clip'
const BOOST_KEY = 'polyrecorder-auto-master-boost'

const DEFAULT_PREVENT_CLIP = true
const DEFAULT_BOOST = true

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

/** Legacy single toggle → both prefs when new keys are missing. */
function readLegacyBoth(): boolean | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (raw === '0' || raw === 'false') return false
    if (raw === '1' || raw === 'true') return true
  } catch {
    // ignore
  }
  return null
}

export function readAutoMasterPreventClip(): boolean {
  try {
    if (localStorage.getItem(PREVENT_CLIP_KEY) != null) {
      return readFlag(PREVENT_CLIP_KEY, DEFAULT_PREVENT_CLIP)
    }
  } catch {
    // ignore
  }
  const legacy = readLegacyBoth()
  return legacy ?? DEFAULT_PREVENT_CLIP
}

export function readAutoMasterBoost(): boolean {
  try {
    if (localStorage.getItem(BOOST_KEY) != null) {
      return readFlag(BOOST_KEY, DEFAULT_BOOST)
    }
  } catch {
    // ignore
  }
  const legacy = readLegacyBoth()
  return legacy ?? DEFAULT_BOOST
}

export function writeAutoMasterPreventClip(on: boolean): void {
  writeFlag(PREVENT_CLIP_KEY, on)
}

export function writeAutoMasterBoost(on: boolean): void {
  writeFlag(BOOST_KEY, on)
}

/** @deprecated Use readAutoMasterPreventClip / readAutoMasterBoost. */
export function readAutoClipCorrect(): boolean {
  return readAutoMasterPreventClip() || readAutoMasterBoost()
}

/** @deprecated Use writeAutoMasterPreventClip / writeAutoMasterBoost. */
export function writeAutoClipCorrect(on: boolean): void {
  writeAutoMasterPreventClip(on)
  writeAutoMasterBoost(on)
}
