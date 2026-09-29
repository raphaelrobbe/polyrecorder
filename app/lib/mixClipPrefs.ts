/** Client preference: auto-lower master when the mix bus would clip. */

const AUTO_CLIP_CORRECT_KEY = 'polyrecorder-auto-clip-correct'
const DEFAULT_AUTO_CLIP_CORRECT = true

export function readAutoClipCorrect(): boolean {
  try {
    const raw = localStorage.getItem(AUTO_CLIP_CORRECT_KEY)
    if (raw === '0' || raw === 'false') return false
    if (raw === '1' || raw === 'true') return true
  } catch {
    // ignore
  }
  return DEFAULT_AUTO_CLIP_CORRECT
}

export function writeAutoClipCorrect(on: boolean): void {
  try {
    localStorage.setItem(AUTO_CLIP_CORRECT_KEY, on ? '1' : '0')
  } catch {
    // ignore
  }
}
