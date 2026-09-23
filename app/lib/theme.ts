export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'polyrecorder-theme'

export function getThemePreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    // private mode / blocked storage
  }
  return 'system'
}

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'light' || pref === 'dark') return pref
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/** Apply resolved theme classes on <html> (call before first paint when possible). */
export function applyTheme(pref: ThemePreference = getThemePreference()): ResolvedTheme {
  const resolved = resolveTheme(pref)
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.classList.toggle('light', resolved === 'light')
  root.dataset.theme = resolved
  root.style.colorScheme = resolved
  return resolved
}

export function setThemePreference(pref: ThemePreference): ResolvedTheme {
  try {
    localStorage.setItem(STORAGE_KEY, pref)
  } catch {
    // ignore
  }
  return applyTheme(pref)
}

/** Toggle to the opposite of the currently resolved appearance. */
export function toggleThemePreference(
  current: ThemePreference = getThemePreference(),
): ThemePreference {
  const next: ThemePreference =
    resolveTheme(current) === 'dark' ? 'light' : 'dark'
  setThemePreference(next)
  return next
}
