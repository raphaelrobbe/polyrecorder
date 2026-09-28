/**
 * Capture `beforeinstallprompt` as early as possible (root bootstrap).
 * The React banner reads the deferred event from here.
 */

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<(event: BeforeInstallPromptEvent | null) => void>()

function emit() {
  for (const listener of listeners) listener(deferredPrompt)
}

export function getDeferredPwaPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt
}

export function subscribeDeferredPwaPrompt(
  listener: (event: BeforeInstallPromptEvent | null) => void,
): () => void {
  listeners.add(listener)
  listener(deferredPrompt)
  return () => {
    listeners.delete(listener)
  }
}

export function clearDeferredPwaPrompt(): void {
  deferredPrompt = null
  emit()
}

/** Call once from the client root (alongside service worker registration). */
export function initPwaInstallCapture(): void {
  if (typeof window === 'undefined') return
  if ((window as Window & { __polyrecorderPwaCapture?: boolean }).__polyrecorderPwaCapture) {
    return
  }
  ;(window as Window & { __polyrecorderPwaCapture?: boolean }).__polyrecorderPwaCapture =
    true

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    emit()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    emit()
  })
}
