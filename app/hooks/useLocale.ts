import { useSyncExternalStore } from 'react'
import {
  applyLocale,
  getLocale,
  setLocale,
  type Locale,
} from '../lib/i18n'

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

function rematerializeDefaults(next: Locale) {
  if (typeof window === 'undefined') return
  void import('../lib/sessionActions.client').then((mod) => {
    mod.rematerializeLocalizedDefaults(next)
  })
}

function applyLocaleChange(next: Locale) {
  setLocale(next)
  rematerializeDefaults(next)
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
  rematerializeDefaults(getLocale())
  emit()
}
