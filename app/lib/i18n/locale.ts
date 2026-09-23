export type Locale = 'fr' | 'en' | 'de' | 'no'

export type LocaleInfo = {
  code: Locale
  /** Flag emoji shown in pickers. */
  flag: string
  /** Native language name (not translated). */
  nativeName: string
}

/** Available UI languages — append here when adding a locale. */
export const LOCALES: readonly LocaleInfo[] = [
  { code: 'fr', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'en', flag: '🇬🇧', nativeName: 'English' },
  { code: 'de', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'no', flag: '🇳🇴', nativeName: 'Norsk' },
] as const

/** Browser tags that map to a supported Locale (e.g. nb/nn → no). */
const BROWSER_ALIASES: Record<string, Locale> = {
  nb: 'no',
  nn: 'no',
}

const STORAGE_KEY = 'polyrecorder-locale'
const localeCodes = new Set<string>(LOCALES.map((item) => item.code))

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && localeCodes.has(value)
}

export function getLocaleInfo(code: Locale): LocaleInfo {
  return LOCALES.find((item) => item.code === code) ?? LOCALES[0]!
}

function matchBrowserTag(tag: string): Locale | null {
  const lower = tag.toLowerCase()
  const primary = lower.split('-')[0] ?? lower
  if (isLocale(primary)) return primary
  const aliased = BROWSER_ALIASES[primary]
  if (aliased) return aliased
  for (const { code } of LOCALES) {
    if (lower === code || lower.startsWith(`${code}-`)) return code
  }
  return null
}

function detectBrowserLocale(): Locale {
  try {
    const languages =
      typeof navigator !== 'undefined'
        ? navigator.languages?.length
          ? navigator.languages
          : [navigator.language]
        : []
    for (const lang of languages) {
      if (!lang) continue
      const matched = matchBrowserTag(lang)
      if (matched) return matched
    }
  } catch {
    // ignore
  }
  return 'en'
}

export function getStoredLocale(): Locale | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (isLocale(raw)) return raw
  } catch {
    // private mode / blocked storage
  }
  return null
}

export function getLocale(): Locale {
  return getStoredLocale() ?? detectBrowserLocale()
}

/** Apply <html lang> (and remember for first paint when called early). */
export function applyLocale(locale: Locale = getLocale()): Locale {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
  return locale
}

export function setLocale(locale: Locale): Locale {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // ignore
  }
  return applyLocale(locale)
}
