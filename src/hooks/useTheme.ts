import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  applyTheme,
  getThemePreference,
  resolveTheme,
  setThemePreference,
  toggleThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from '../lib/theme'

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

function getSnapshot(): ThemePreference {
  return getThemePreference()
}

function getServerSnapshot(): ThemePreference {
  return 'system'
}

export function useTheme() {
  const preference = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    typeof window === 'undefined' ? 'light' : resolveTheme(preference),
  )

  useEffect(() => {
    setResolved(applyTheme(preference))

    if (preference !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      setResolved(applyTheme('system'))
      emit()
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  return {
    preference,
    resolved,
    setPreference: (pref: ThemePreference) => {
      setThemePreference(pref)
      emit()
    },
    toggle: () => {
      toggleThemePreference(preference)
      emit()
    },
  }
}
