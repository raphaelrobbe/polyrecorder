import { useCallback, useRef, useState } from 'react'
import { formatCentis, getMixDurationMs } from '../lib/format'
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
} from '../lib/sessionActions'
import { useSessionStore } from '../store/sessionStore'
import { TrackRow } from './TrackRow'

const TOUCH_REORDER_THRESHOLD_PX = 8
const TOUCH_REORDER_EXCLUDE =
  'input, textarea, select, button:not(.track-drag), .track-mute, .track-check, .track-name, .track-nudge, .track-offset, [data-offset-track], [data-delete-track], [data-delete-all-tracks], [data-nudge-track], [data-auto-align-track], [data-toggle-track]'

type DragOverState = { trackId: number; edge: 'before' | 'after' } | null

export function TracksList() {
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
      '.track-row',
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
        '.track-row',
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
      <div className="tracks" data-tracks-panel>
        <p className="mix-clock" data-mix-clock>
          {mixClockText}
        </p>
        <div
          className="mix-seek"
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
            className="mix-seek-fill"
            data-mix-seek-fill
            style={{ width: pct }}
          />
        </div>
        <p className="ref-peaks" data-ref-peaks hidden={!showRefPeaks}>
          {showRefPeaks ? refPeaksLabel : ''}
        </p>
        <div className="tracks-master-row">
          <span className="tracks-master-drag" aria-hidden="true" />
          <label
            className="track-mute"
            title="Activer / couper toutes les pistes"
          >
            <input
              type="checkbox"
              data-select-all
              aria-label="Activer toutes les pistes"
              checked={allSelected}
              ref={(el) => {
                if (el) {
                  el.indeterminate =
                    selectedCount > 0 && selectedCount < tracks.length
                }
              }}
              onChange={(event) => setAllTracksEnabled(event.target.checked)}
            />
            <span className="track-mute-icon" aria-hidden="true">
              <svg className="icon-speaker-on" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"
                />
              </svg>
              <svg className="icon-speaker-off" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M3.63 3.63 2.22 5.04 6.18 9H3v6h4l5 5v-6.96l4.57 4.57A7 7 0 0 1 14 18.7v2.06a9 9 0 0 0 3.33-1.68l2.63 2.63 1.41-1.41L3.63 3.63zM16.5 12c0-.77-.2-1.5-.54-2.14l1.5-1.5A6.9 6.9 0 0 1 18.5 12a6.9 6.9 0 0 1-.8 3.22l1.52 1.52A8.9 8.9 0 0 0 20.5 12c0-2.8-1.28-5.3-3.3-6.93l-1.47 1.47A6.95 6.95 0 0 1 16.5 12zM12 4 9.91 6.09 12 8.18V4z"
                />
              </svg>
            </span>
          </label>
          <div className="tracks-master-spacer">
            <button
              type="button"
              className="btn btn-trash btn-trash-all"
              data-delete-all-tracks
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
            >
              ×
            </button>
          </div>
          <label
            className="track-check track-check-align"
            data-align-header
            hidden={!calageMode || alignable.length === 0}
            title="Activer / désactiver le calage auto (sauf piste 1)"
          >
            <input
              type="checkbox"
              data-align-all
              aria-label="Calage auto sur toutes les pistes"
              checked={allAutoAlign}
              disabled={alignable.length === 0 || !calageMode}
              ref={(el) => {
                if (el) {
                  el.indeterminate = someAutoAlign && !allAutoAlign
                }
              }}
              onChange={(event) => setAllAutoAlign(event.target.checked)}
            />
            <span className="track-check-box" aria-hidden="true" />
          </label>
          <span
            className="tracks-master-nudge"
            data-align-nudge-spacer
            hidden={!calageMode || alignable.length === 0}
            aria-hidden="true"
          />
        </div>
        <ul
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
            const row = target.closest('.track-row')
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
            const row = event.target.closest<HTMLElement>('.track-row')
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
        className="skew-warning"
        data-skew-warning
        hidden={!skewWarningMessage}
        title="Un calage auto supérieur à 300 ms indique souvent un problème de sync (marquages peu clairs, latence, etc.). Ouvre le mode calage pour inspecter et ajuster."
      >
        <button
          type="button"
          className="btn-skew-close"
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
          <button
            type="button"
            className="btn btn-skew"
            data-open-advanced
            onClick={() => {
              setError(null)
              setCalageMode(true)
            }}
          >
            Ouvrir le mode calage
          </button>
        ) : null}
      </div>
    </>
  )
}
