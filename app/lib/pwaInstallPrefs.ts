/** localStorage prefs for the occasional PWA install invite. */

const FIRST_USEFUL_KEY = 'polyrecorder-pwa-first-useful-at'
const DISMISSED_UNTIL_KEY = 'polyrecorder-pwa-dismissed-until'
const INSTALLED_KEY = 'polyrecorder-pwa-installed'

/** Wait this long after the first useful session before showing the invite. */
export const PWA_INSTALL_MIN_DELAY_MS = 2 * 24 * 60 * 60 * 1000
/** After dismiss / “later”, wait this long before offering again. */
export const PWA_INSTALL_DISMISS_COOLDOWN_MS = 21 * 24 * 60 * 60 * 1000

function readMs(key: string): number | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

function writeMs(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // ignore quota / private mode
  }
}

/** First time the user completes a useful take (record/import). Idempotent. */
export function markPwaUsefulSession(): void {
  if (readMs(FIRST_USEFUL_KEY) != null) return
  writeMs(FIRST_USEFUL_KEY, Date.now())
}

export function readPwaFirstUsefulAt(): number | null {
  return readMs(FIRST_USEFUL_KEY)
}

export function dismissPwaInstallPrompt(
  cooldownMs = PWA_INSTALL_DISMISS_COOLDOWN_MS,
): void {
  writeMs(DISMISSED_UNTIL_KEY, Date.now() + cooldownMs)
}

export function markPwaInstalled(): void {
  try {
    localStorage.setItem(INSTALLED_KEY, '1')
  } catch {
    // ignore
  }
}

export function isPwaInstallMarkedInstalled(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Whether the invite is allowed by timing prefs (not by browser capability).
 * Caller still checks standalone / beforeinstallprompt / iOS.
 */
export function shouldOfferPwaInstallByPrefs(now = Date.now()): boolean {
  if (isPwaInstallMarkedInstalled()) return false
  const dismissedUntil = readMs(DISMISSED_UNTIL_KEY)
  if (dismissedUntil != null && now < dismissedUntil) return false
  const firstUseful = readMs(FIRST_USEFUL_KEY)
  if (firstUseful == null) return false
  return now - firstUseful >= PWA_INSTALL_MIN_DELAY_MS
}
