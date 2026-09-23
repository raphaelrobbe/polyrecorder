import { de } from './de'
import { en } from './en'
import { fr, type MessageKey } from './fr'
import { no } from './no'
import { getLocale, type Locale, type LocaleInfo } from './locale'

export type { Locale, LocaleInfo, MessageKey }
export {
  LOCALES,
  applyLocale,
  getLocale,
  getLocaleInfo,
  getStoredLocale,
  isLocale,
  setLocale,
} from './locale'

const catalogs: Record<Locale, Record<MessageKey, string>> = {
  fr,
  en,
  de,
  no,
}

export type TVars = Record<string, string | number>

/** Translate a message key for the current (or given) locale. */
export function t(
  key: MessageKey,
  vars?: TVars,
  locale: Locale = getLocale(),
): string {
  const template = catalogs[locale][key] ?? catalogs.fr[key] ?? key
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value == null ? match : String(value)
  })
}

/**
 * Pick a one/other message by count (singular for 0 and 1, plural otherwise).
 */
export function tp(
  keyOne: MessageKey,
  keyOther: MessageKey,
  count: number,
  locale: Locale = getLocale(),
): string {
  return t(count <= 1 ? keyOne : keyOther, { count }, locale)
}
