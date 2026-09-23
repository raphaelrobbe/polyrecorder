import { useSyncExternalStore } from 'react'
import {
  applyLocale,
  getLocale,
  markClientLocaleReady,
  setLocale,
  SSR_LOCALE,
  type Locale,
} from '../lib/i18n/locale'

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
  return SSR_LOCALE
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

/**
 * Call once from the app root after mount so `t()` / `getLocale()` can leave
 * the SSR-stable locale and pick localStorage / browser preference.
 */
export function initLocale() {
  markClientLocaleReady()
  applyLocale()
  rematerializeDefaults(getLocale())
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
