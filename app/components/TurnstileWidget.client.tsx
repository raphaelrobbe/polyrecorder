import { useEffect, useRef } from 'react'
import { cn } from '../lib/utils'

type TurnstileWidgetProps = {
  siteKey: string
  onToken: (token: string | null) => void
  className?: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
        },
      ) => string
      remove: (widgetId: string) => void
    }
    onPolyrecorderTurnstileLoad?: () => void
  }
}

const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onPolyrecorderTurnstileLoad'

/** Explicit Turnstile widget; calls `onToken` when solved / cleared. */
export function TurnstileWidget({
  siteKey,
  onToken,
  className,
}: TurnstileWidgetProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken

  useEffect(() => {
    let cancelled = false

    const mount = () => {
      if (cancelled || !hostRef.current || !window.turnstile) return
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
      widgetIdRef.current = window.turnstile.render(hostRef.current, {
        sitekey: siteKey,
        callback: (token) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(null),
        'error-callback': () => onTokenRef.current(null),
      })
    }

    if (window.turnstile) {
      mount()
    } else {
      window.onPolyrecorderTurnstileLoad = () => {
        mount()
      }
      if (!document.getElementById(SCRIPT_ID)) {
        const script = document.createElement('script')
        script.id = SCRIPT_ID
        script.src = SCRIPT_SRC
        script.async = true
        document.head.appendChild(script)
      }
    }

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
      onTokenRef.current(null)
    }
  }, [siteKey])

  return <div ref={hostRef} className={cn('min-h-[65px]', className)} />
}
