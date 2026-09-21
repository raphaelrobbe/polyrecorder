import { useCallback, useRef, useState } from 'react'
import { formatCentis, getMixDurationMs } from '../../lib/format'
import {
  alignableTracks,
  deleteAllTracks,
  dismissSkewWarning,
  reorderTrack,
  seekMixTo,
  setAllAutoAlign,
  setAllTracksEnabled,
  setCalageMode,
  setError,
} from '../../lib/sessionActions'
import { cn } from '../../lib/utils'
import { useSessionStore } from '../../store/sessionStore'
import { Button } from '../Button'
import { IconClose } from '../icons'
import { TrackAlignCheck } from './TrackAlignCheck'
import { TrackMute } from './TrackMute'
import { TrackRow } from './TrackRow'

const TOUCH_REORDER_THRESHOLD_PX = 8
const TOUCH_REORDER_EXCLUDE =
  'input, textarea, select, button:not([data-drag-track]), [data-track-mute], [data-track-align], [data-rename-track], [data-track-nudge], [data-offset-track], [data-delete-track], [data-delete-all-tracks], [data-nudge-track], [data-auto-align-track], [data-toggle-track]'

type DragOverState = { trackId: number; edge: 'before' | 'after' } | null

type TracksListProps = {
  className?: string
}

export function TracksList({ className }: TracksListProps) {
  const tracks = useSessionStore((s) => s.tracks)
  const state = useSessionStore((s) => s.state)
  const calageMode = useSessionStore((s) => s.calageMode)
  const enabledTrackIds = useSessionStore((s) => s.enabledTrackIds)
  const autoAlignTrackIds = useSessionStore((s) => s.autoAlignTrackIds)
  const mixClockText = useSessionStore((s) => s.mixClockText)
  const mixSeekMs = useSessionStore((s) => s.mixSeekMs)
  const refPeaksLabel = useSessionStore((s) => s.refPeaksLabel)
  const skewWarningMessage = useSessionStore((s) => s.skewWarningMessage)
  const skewWarningShowOpenAdvanced = useSessionStore(
    (s) => s.skewWarningShowOpenAdvanced,
  )
  const setSeekDragActive = useSessionStore((s) => s.setSeekDragActive)
  const patch = useSessionStore((s) => s.patch)

  const listRef = useRef<HTMLUListElement>(null)
  const seekRef = useRef<HTMLDivElement>(null)
  const dragTrackIdRef = useRef<number | null>(null)
  const touchReorderRef = useRef<{
    pointerId: number
    trackId: number
    startY: number
    active: boolean
  } | null>(null)

  const [dragTrackId, setDragTrackId] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<DragOverState>(null)

  const alignable = alignableTracks()
  const selectedCount = enabledTrackIds.length
  const allSelected = tracks.length > 0 && selectedCount === tracks.length
  const allAutoAlign =
    alignable.length > 0 &&
    alignable.every((track) => autoAlignTrackIds.includes(track.id))
  const someAutoAlign = alignable.some((track) =>
    autoAlignTrackIds.includes(track.id),
  )
  const masterMuteIndeterminate =
    selectedCount > 0 && selectedCount < tracks.length

  const duration = getMixDurationMs(tracks)
  const seekPosition = mixSeekMs
  const clamped = duration > 0 ? Math.min(seekPosition, duration) : 0
  const ratio = duration > 0 ? clamped / duration : 0
  const pct = `${Math.max(0, Math.min(1, ratio)) * 100}%`

  const previewSeek = (ms: number) => {
    patch({ mixSeekMs: ms, mixClockText: formatCentis(ms) })
  }

  const clearDragState = useCallback(() => {
    dragTrackIdRef.current = null
    touchReorderRef.current = null
    setDragTrackId(null)
    setDragOver(null)
  }, [])

  const updateDragOverFromPoint = useCallback((clientY: number) => {
    const fromId = dragTrackIdRef.current
    if (fromId == null || !listRef.current) return

    let targetRow: HTMLElement | null = null
    for (const row of listRef.current.querySelectorAll<HTMLElement>(
      '[data-track-id]',
    )) {
      const id = Number(row.dataset.trackId)
      if (id === fromId) continue
      const rect = row.getBoundingClientRect()
      if (clientY >= rect.top && clientY <= rect.bottom) {
        targetRow = row
        break
      }
    }

    if (!targetRow) {
      setDragOver(null)
      return
    }

    const targetId = Number(targetRow.dataset.trackId)
    const rect = targetRow.getBoundingClientRect()
    const before = clientY < rect.top + rect.height / 2
    setDragOver({ trackId: targetId, edge: before ? 'before' : 'after' })
  }, [])

  const commitDragOverFromPoint = useCallback(
    (clientY: number) => {
      const fromId = dragTrackIdRef.current
      if (fromId == null || !listRef.current) {
        clearDragState()
        return
      }

      let targetRow: HTMLElement | null = null
      for (const row of listRef.current.querySelectorAll<HTMLElement>(
        '[data-track-id]',
      )) {
        const id = Number(row.dataset.trackId)
        if (id === fromId) continue
        const rect = row.getBoundingClientRect()
        if (clientY >= rect.top && clientY <= rect.bottom) {
          targetRow = row
          break
        }
      }

      clearDragState()
      if (!targetRow) return

      const targetId = Number(targetRow.dataset.trackId)
      if (!Number.isFinite(targetId) || targetId === fromId) return

      const rect = targetRow.getBoundingClientRect()
      const before = clientY < rect.top + rect.height / 2
      const index = tracks.findIndex((track) => track.id === targetId)
      const afterId =
        index >= 0 ? (tracks[index + 1]?.id ?? null) : null
      reorderTrack(fromId, before ? targetId : afterId)
    },
    [clearDragState, tracks],
  )

  const seekRatioFromPointer = (clientX: number) => {
    const el = seekRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return 0
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }

  if (tracks.length === 0) return null

  const showRefPeaks = calageMode && Boolean(refPeaksLabel)

  return (
    <>
      <div
        className={cn('relative mt-5 pt-[0.35rem]', className)}
        data-tracks-panel
      >
        <p className="mb-[0.35rem] mt-0 text-center text-[0.95rem] font-bold tracking-[0.04em] tabular-nums text-ink-soft" data-mix-clock>
          {mixClockText}
        </p>
        <div
          className="relative mb-[0.85rem] h-[0.55rem] cursor-pointer touch-none rounded-full bg-ink/10 after:pointer-events-none after:absolute after:top-1/2 after:left-[var(--seek-thumb,0%)] after:h-[0.7rem] after:w-[0.7rem] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border-2 after:border-paper after:bg-ink after:opacity-0 after:shadow-[0_1px_3px_color-mix(in_srgb,var(--ink)_20%,transparent)] after:content-[''] hover:after:opacity-100 focus-visible:after:opacity-100"
          data-mix-seek
          role="slider"
          tabIndex={0}
          aria-label="Position de lecture"
          aria-valuemin={0}
          aria-valuenow={Math.round(clamped)}
          aria-valuemax={Math.round(duration)}
          ref={seekRef}
          style={{ ['--seek-thumb' as string]: pct }}
          onPointerDown={(event) => {
            if (state === 'recording') return
            event.preventDefault()
            setSeekDragActive(true)
            const next = seekRatioFromPointer(event.clientX) * duration
            previewSeek(next)
            event.currentTarget.setPointerCapture(event.pointerId)
          }}
          onPointerMove={(event) => {
            if (!useSessionStore.getState().seekDragActive) return
            const next = seekRatioFromPointer(event.clientX) * duration
            previewSeek(next)
          }}
          onPointerUp={(event) => {
            if (!useSessionStore.getState().seekDragActive) return
            setSeekDragActive(false)
            try {
              event.currentTarget.releasePointerCapture(event.pointerId)
            } catch {
              // ignore
            }
            void seekMixTo(useSessionStore.getState().mixSeekMs)
          }}
          onPointerCancel={() => setSeekDragActive(false)}
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-0 rounded-[inherit] bg-ink"
            data-mix-seek-fill
            style={{ width: pct }}
          />
        </div>
        <p
          className="mt-[0.55rem] mb-[0.15rem] text-left text-[0.78rem] font-semibold leading-[1.45] tracking-[0.01em] whitespace-pre-line tabular-nums text-ink-soft"
          data-ref-peaks
          hidden={!showRefPeaks}
        >
          {showRefPeaks ? refPeaksLabel : ''}
        </p>
        <div className="mb-[0.45rem] flex min-h-[1.7rem] items-center gap-[0.12rem]">
          <span className="w-[1.35rem] shrink-0" aria-hidden="true" />
          <TrackMute
            title="Activer / couper toutes les pistes"
            ariaLabel="Activer toutes les pistes"
            checked={allSelected}
            indeterminate={masterMuteIndeterminate}
            onCheckedChange={(on) => setAllTracksEnabled(on)}
            inputProps={{ 'data-select-all': true }}
          />
          <div className="flex min-w-0 flex-auto items-center justify-end">
            <Button
              variant="trash"
              className="h-[1.7rem] w-[1.7rem] rounded-lg text-[1.15rem]"
              icon={<IconClose />}
              aria-label="Supprimer toutes les pistes"
              title="Supprimer toutes les pistes"
              disabled={state === 'recording'}
              onClick={() => {
                const count = tracks.length
                const ok = window.confirm(
                  count === 1
                    ? `Supprimer la piste « ${tracks[0]!.name} » ?`
                    : `Supprimer les ${count} pistes ? Elles seront définitivement perdues.`,
                )
                if (!ok) return
                deleteAllTracks()
              }}
            />
          </div>
          <TrackAlignCheck
            hidden={!calageMode || alignable.length === 0}
            title="Activer / désactiver le calage auto (sauf piste 1)"
            ariaLabel="Calage auto sur toutes les pistes"
            checked={allAutoAlign}
            indeterminate={someAutoAlign && !allAutoAlign}
            disabled={alignable.length === 0 || !calageMode}
            onCheckedChange={(on) => setAllAutoAlign(on)}
            inputProps={{ 'data-align-all': true }}
            labelProps={{ 'data-align-header': true }}
          />
          <span
            className="w-[7.1rem] shrink-0"
            data-align-nudge-spacer
            hidden={!calageMode || alignable.length === 0}
            aria-hidden="true"
          />
        </div>
        <ul
          className={cn(
            'm-0 flex list-none flex-col gap-[0.45rem] p-0',
            calageMode && 'gap-[0.15rem]',
          )}
          data-tracks
          ref={listRef}
          onDragStart={(event) => {
            const target = event.target
            if (!(target instanceof Element)) return
            const handle = target.closest<HTMLElement>('[data-drag-track]')
            if (!handle || !event.dataTransfer) return
            const id = Number(handle.dataset.dragTrack)
            if (!Number.isFinite(id)) return
            touchReorderRef.current = null
            dragTrackIdRef.current = id
            setDragTrackId(id)
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', String(id))
          }}
          onDragEnd={() => clearDragState()}
          onDragOver={(event) => {
            if (dragTrackIdRef.current == null) return
            event.preventDefault()
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
            updateDragOverFromPoint(event.clientY)
          }}
          onDragLeave={(event) => {
            const target = event.target
            if (!(target instanceof Element)) return
            const row = target.closest('[data-track-id]')
            if (!row) return
            const related = event.relatedTarget
            if (related instanceof Node && row.contains(related)) return
            setDragOver((prev) =>
              prev && Number((row as HTMLElement).dataset.trackId) === prev.trackId
                ? null
                : prev,
            )
          }}
          onDrop={(event) => {
            if (dragTrackIdRef.current == null) return
            event.preventDefault()
            commitDragOverFromPoint(event.clientY)
          }}
          onPointerDown={(event) => {
            if (event.pointerType === 'mouse') return
            if (!(event.target instanceof Element)) return
            if (event.target.closest(TOUCH_REORDER_EXCLUDE)) return
            const row = event.target.closest<HTMLElement>('[data-track-id]')
            if (!row) return
            const id = Number(row.dataset.trackId)
            if (!Number.isFinite(id)) return
            touchReorderRef.current = {
              pointerId: event.pointerId,
              trackId: id,
              startY: event.clientY,
              active: false,
            }
          }}
          onPointerMove={(event) => {
            const touch = touchReorderRef.current
            if (!touch || touch.pointerId !== event.pointerId) return
            const dy = event.clientY - touch.startY
            if (!touch.active) {
              if (Math.abs(dy) < TOUCH_REORDER_THRESHOLD_PX) return
              touch.active = true
              dragTrackIdRef.current = touch.trackId
              setDragTrackId(touch.trackId)
              try {
                event.currentTarget.setPointerCapture(event.pointerId)
              } catch {
                // ignore
              }
            }
            event.preventDefault()
            updateDragOverFromPoint(event.clientY)
          }}
          onPointerUp={(event) => {
            const touch = touchReorderRef.current
            if (!touch || touch.pointerId !== event.pointerId) return
            if (touch.active) {
              commitDragOverFromPoint(event.clientY)
            } else {
              touchReorderRef.current = null
            }
          }}
          onPointerCancel={() => {
            if (!touchReorderRef.current) return
            clearDragState()
          }}
        >
          {tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              isDragging={dragTrackId === track.id}
              dragOver={
                dragOver?.trackId === track.id ? dragOver.edge : null
              }
            />
          ))}
        </ul>
      </div>

      <div
        className="relative mt-4 flex flex-wrap items-center gap-x-3 gap-y-[0.55rem] rounded-[14px] border-[1.5px] border-[rgba(176,110,20,0.35)] bg-[rgba(232,176,72,0.16)] py-[0.85rem] pr-[2.1rem] pl-[0.95rem] text-[0.88rem] leading-[1.35] text-[#6a4508] [&_strong]:font-extrabold [&_strong]:tracking-[0.02em]"
        data-skew-warning
        hidden={!skewWarningMessage}
        title="Un calage auto supérieur à 300 ms indique souvent un problème de sync (marquages peu clairs, latence, etc.). Ouvre le mode calage pour inspecter et ajuster."
      >
        <button
          type="button"
          className="absolute top-[0.35rem] right-[0.4rem] h-[1.6rem] w-[1.6rem] cursor-pointer rounded-lg border-0 bg-transparent p-0 text-[1.15rem] leading-none text-[#6a4508] hover:bg-[rgba(176,110,20,0.12)]"
          data-dismiss-skew
          aria-label="Fermer"
          title="Fermer"
          onClick={() => dismissSkewWarning()}
        >
          ×
        </button>
        <strong>Attention</strong>
        <span data-skew-warning-text>{skewWarningMessage}</span>
        {skewWarningShowOpenAdvanced ? (
          <Button
            variant="default"
            className="ml-auto border-[1.5px] border-[rgba(176,110,20,0.4)] bg-transparent px-3 py-[0.4rem] text-[0.8rem] text-[#6a4508] hover:enabled:bg-[rgba(176,110,20,0.1)]"
            onClick={() => {
              setError(null)
              setCalageMode(true)
            }}
          >
            Ouvrir le mode calage
          </Button>
        ) : null}
      </div>
    </>
  )
}
