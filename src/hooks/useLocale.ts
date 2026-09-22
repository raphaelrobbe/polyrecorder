import { useSyncExternalStore } from 'react'
import {
  applyLocale,
  getLocale,
  setLocale,
  type Locale,
} from '../lib/i18n'
import { rematerializeLocalizedDefaults } from '../lib/sessionActions'

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): Locale {
  return getLocale()
}

function getServerSnapshot(): Locale {
  return 'en'
}

function applyLocaleChange(next: Locale) {
  setLocale(next)
  rematerializeLocalizedDefaults(next)
  emit()
}

export function useLocale() {
  const locale = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  return {
    locale,
    setLocale: (next: Locale) => {
      applyLocaleChange(next)
    },
  }
}

/** Ensure html[lang] matches stored/detected locale once on the client. */
export function initLocale() {
  applyLocale()
  rematerializeLocalizedDefaults(getLocale())
  emit()
}
