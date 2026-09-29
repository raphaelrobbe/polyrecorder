import { useEffect, useId, useRef, useState } from 'react'
import type { Track } from '../../common/types'
import { getMixDurationMs } from '../../lib/format'
import {
  mergeMuteRanges,
  mixRangeFromBuffer,
} from '../../lib/audio/segments.client'
import { removeCutMuteRange } from '../../lib/sessionActions.client'
import { useLocale } from '../../hooks/useLocale'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { useSessionStore } from '../../store/sessionStore'

type CutMuteBarsProps = {
  track: Track
}

/** Hatched mute ranges under a track in cut mode; click opens remove menu. */
export function CutMuteBars({ track }: CutMuteBarsProps) {
  useLocale()
  const tracks = useSessionStore((s) => s.tracks)
  const ranges = mergeMuteRanges(track.muteRanges ?? [])
  const [openKey, setOpenKey] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!openKey) return
    const onDocPointer = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpenKey(null)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenKey(null)
    }
    document.addEventListener('pointerdown', onDocPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [openKey])

  if (ranges.length === 0) return null

  const mixDur = Math.max(1, getMixDurationMs(tracks))

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative h-[0.62rem] w-full min-w-0',
        openKey != null && 'z-30',
      )}
      role="group"
      aria-label={t('cut.mute.barAria', { name: track.name })}
      {...(openKey != null ? { 'data-mute-menu-open': true } : {})}
    >
      {ranges.map((range, index) => {
        const mix = mixRangeFromBuffer(track, range.startMs, range.endMs)
        const startMs = Math.max(0, Math.min(mixDur, mix.startMs))
        const endMs = Math.max(startMs, Math.min(mixDur, mix.endMs))
        if (endMs <= startMs) return null
        const leftPct = (startMs / mixDur) * 100
        const widthPct = Math.max(0.6, ((endMs - startMs) / mixDur) * 100)
        const key = `${range.startMs}-${range.endMs}-${index}`
        const open = openKey === key
        return (
          <div
            key={key}
            className={cn(
              'absolute top-0 bottom-0',
              open ? 'z-40' : 'z-[1]',
            )}
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          >
            <button
              type="button"
              title={t('cut.mute.barTitle')}
              aria-label={t('cut.mute.barTitle')}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={open ? menuId : undefined}
              onClick={(event) => {
                event.stopPropagation()
                setOpenKey((prev) => (prev === key ? null : key))
              }}
              className={cn(
                'absolute inset-0 min-w-[0.4rem] cursor-pointer rounded-[0.2rem] border border-ink/28 p-0',
                'bg-[repeating-linear-gradient(-45deg,color-mix(in_srgb,var(--ink)_28%,transparent),color-mix(in_srgb,var(--ink)_28%,transparent)_1.5px,transparent_1.5px,transparent_3.5px)]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-mode-cut/40 focus-visible:outline-offset-1',
                open && 'border-ink/45',
              )}
            />
            {open ? (
              <div
                id={menuId}
                role="menu"
                aria-label={t('cut.mute.removeAria')}
                className={cn(
                  'absolute left-1/2 top-[calc(100%+0.28rem)] z-50 min-w-[11rem] -translate-x-1/2',
                  'overflow-hidden rounded-[12px] border border-line bg-surface p-[0.28rem]',
                  'shadow-[0_12px_32px_color-mix(in_srgb,var(--ink)_22%,transparent)]',
                )}
              >
                <button
                  type="button"
                  role="menuitem"
                  className={cn(
                    'flex w-full cursor-pointer items-center rounded-[8px] border-0 bg-surface px-[0.65rem] py-[0.55rem]',
                    'text-left font-[inherit] text-[0.9rem] font-bold leading-normal text-ink',
                    'hover:bg-ink/8',
                  )}
                  onClick={(event) => {
                    event.stopPropagation()
                    setOpenKey(null)
                    removeCutMuteRange(track.id, range.startMs, range.endMs)
                  }}
                >
                  {t('cut.mute.remove')}
                </button>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
