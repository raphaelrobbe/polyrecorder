import { useCallback, useEffect, useState } from 'react'
import {
  clearDeferredPwaPrompt,
  getDeferredPwaPrompt,
  subscribeDeferredPwaPrompt,
  type BeforeInstallPromptEvent,
} from '../lib/pwaInstallCapture.client'
import {
  dismissPwaInstallPrompt,
  markPwaInstalled,
  shouldOfferPwaInstallByPrefs,
} from '../lib/pwaInstallPrefs'

export type PwaInstallMode = 'chromium' | 'ios' | null

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return Boolean(nav.standalone)
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  return (
    navigator.platform === 'MacIntel' &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1
  )
}

/**
 * Decides when a soft install invite may appear (prefs + browser capability).
 * Relies on `initPwaInstallCapture()` in the root for the Chromium prompt.
 */
export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window === 'undefined' ? null : getDeferredPwaPrompt()),
  )
  const [visible, setVisible] = useState(false)
  const [iosHelpOpen, setIosHelpOpen] = useState(false)

  const mode: PwaInstallMode = deferred
    ? 'chromium'
    : isIosDevice() && !isStandaloneDisplay()
      ? 'ios'
      : null

  const recomputeVisible = useCallback(
    (promptEvent: BeforeInstallPromptEvent | null) => {
      if (isStandaloneDisplay()) {
        setVisible(false)
        return
      }
      if (!shouldOfferPwaInstallByPrefs()) {
        setVisible(false)
        return
      }
      const canShow =
        promptEvent != null || (isIosDevice() && !isStandaloneDisplay())
      setVisible(canShow)
    },
    [],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const unsubscribe = subscribeDeferredPwaPrompt((event) => {
      setDeferred(event)
      recomputeVisible(event)
    })

    const onAppInstalled = () => {
      markPwaInstalled()
      clearDeferredPwaPrompt()
      setVisible(false)
      setIosHelpOpen(false)
    }
    window.addEventListener('appinstalled', onAppInstalled)

    recomputeVisible(getDeferredPwaPrompt())

    const timer = window.setInterval(() => {
      recomputeVisible(getDeferredPwaPrompt())
    }, 60 * 60 * 1000)

    return () => {
      unsubscribe()
      window.removeEventListener('appinstalled', onAppInstalled)
      window.clearInterval(timer)
    }
  }, [recomputeVisible])

  const dismiss = useCallback(() => {
    dismissPwaInstallPrompt()
    setVisible(false)
    setIosHelpOpen(false)
  }, [])

  const install = useCallback(async () => {
    const promptEvent = deferred ?? getDeferredPwaPrompt()
    if (promptEvent) {
      try {
        await promptEvent.prompt()
        const choice = await promptEvent.userChoice
        clearDeferredPwaPrompt()
        setDeferred(null)
        if (choice.outcome === 'accepted') {
          markPwaInstalled()
          setVisible(false)
        } else {
          dismissPwaInstallPrompt()
          setVisible(false)
        }
      } catch {
        dismissPwaInstallPrompt()
        setVisible(false)
      }
      return
    }
    if (mode === 'ios') {
      setIosHelpOpen(true)
    }
  }, [deferred, mode])

  return {
    visible,
    mode: visible ? mode : null,
    iosHelpOpen,
    install,
    dismiss,
  }
}
