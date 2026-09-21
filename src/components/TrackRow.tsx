import { useEffect, useState } from 'react'
import type { Track } from '../types'
import {
  formatAlignDetail,
  formatCentis,
  formatTime,
  isDefaultTrackName,
  parseOffsetMsInput,
} from '../lib/format'
import {
  applyManualTrackOffset,
  autoAlignTracksFromCounts,
  deleteTrack,
  getTrackPositionMs,
  renameTrack,
  setError,
  setTrackAutoAlign,
  setTrackEnabled,
} from '../lib/sessionActions'
import { useSessionStore } from '../store/sessionStore'

type TrackRowProps = {
  track: Track
  index: number
  isDragging: boolean
  dragOver: 'before' | 'after' | null
}

export function TrackRow({
  track,
  index,
  isDragging,
  dragOver,
}: TrackRowProps) {
  const calageMode = useSessionStore((s) => s.calageMode)
  const enabledTrackIds = useSessionStore((s) => s.enabledTrackIds)
  const autoAlignTrackIds = useSessionStore((s) => s.autoAlignTrackIds)
  const referenceTrackId = useSessionStore((s) => s.referenceTrackId)
  const trackAlignDetails = useSessionStore((s) => s.trackAlignDetails)
  // Re-render on playhead ticks so per-track clocks stay live in calage mode.
  useSessionStore((s) => s.mixClockText)

  const isEnabled = enabledTrackIds.includes(track.id)
  const autoAlign = autoAlignTrackIds.includes(track.id)
  const isReference = track.id === referenceTrackId
  const alignDetail = trackAlignDetails[track.id]
  const alignDetailText =
    alignDetail && !isReference
      ? formatAlignDetail(track.offsetMs, alignDetail)
      : ''
  const clock = formatCentis(getTrackPositionMs(track.id))

  const [nameDraft, setNameDraft] = useState(track.name)
  const [offsetDraft, setOffsetDraft] = useState(
    String(Math.round(track.offsetMs)),
  )

  useEffect(() => {
    setNameDraft(track.name)
  }, [track.name])

  useEffect(() => {
    setOffsetDraft(String(Math.round(track.offsetMs)))
  }, [track.offsetMs])

  const rowClass = [
    'track-row',
    calageMode ? 'is-advanced' : '',
    isEnabled ? '' : 'is-muted',
    isDragging ? 'is-dragging' : '',
    dragOver ? 'drag-over' : '',
    dragOver === 'before' ? 'drag-over-before' : '',
    dragOver === 'after' ? 'drag-over-after' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={rowClass} data-track-id={track.id}>
      <button
        type="button"
        className="track-drag"
        draggable
        data-drag-track={track.id}
        aria-label={`Réordonner ${track.name}`}
        title="Glisser pour réordonner"
      >
        <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M9 7h2v2H9V7zm4 0h2v2h-2V7zM9 11h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z"
          />
        </svg>
      </button>
      <label className="track-mute" title={isEnabled ? 'Audible' : 'Muet'}>
        <input
          type="checkbox"
          data-toggle-track={track.id}
          checked={isEnabled}
          aria-label={`Écouter ${track.name}`}
          onChange={(event) =>
            setTrackEnabled(track.id, event.target.checked)
          }
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
      <div className="track-main">
        <div className="track-main-body">
          <input
            type="text"
            className={`track-name${isDefaultTrackName(nameDraft) ? ' is-default-name' : ''}`}
            data-rename-track={track.id}
            value={nameDraft}
            aria-label="Nom de la piste"
            maxLength={40}
            onChange={(event) => setNameDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
              }
            }}
            onFocus={(event) => {
              if (!isDefaultTrackName(event.currentTarget.value)) return
              event.currentTarget.select()
              event.currentTarget.addEventListener(
                'mouseup',
                (mouseupEvent) => {
                  mouseupEvent.preventDefault()
                  event.currentTarget.select()
                },
                { once: true },
              )
            }}
            onBlur={() => {
              const next =
                nameDraft.trim().slice(0, 40) || `Piste ${index + 1}`
              setNameDraft(next)
              renameTrack(track.id, next)
            }}
          />
          <span className="track-meta" hidden={!calageMode}>
            {calageMode ? (
              <>
                <small className="track-clock" data-track-clock={track.id}>
                  {clock}
                </small>
                <small className="track-duration">
                  {formatTime(track.durationMs)}
                </small>
              </>
            ) : null}
          </span>
        </div>
        {isReference ? null : (
          <button
            type="button"
            className="btn btn-trash"
            data-delete-track={track.id}
            aria-label={`Supprimer ${track.name}`}
            title="Supprimer"
            onClick={() => {
              const ok = window.confirm(`Supprimer « ${track.name} » ?`)
              if (!ok) return
              deleteTrack(track.id)
            }}
          >
            ×
          </button>
        )}
      </div>
      {calageMode ? (
        <>
          {isReference ? (
            <span
              className="track-check-spacer track-ref-badge"
              title="Piste de référence (marquages 1–2–3–4)"
              aria-label="Référence"
            >
              réf.
            </span>
          ) : (
            <label className="track-check track-check-align" title="Calage auto">
              <input
                type="checkbox"
                data-auto-align-track={track.id}
                checked={autoAlign}
                aria-label={`Calage auto ${track.name}`}
                onChange={(event) => {
                  const on = event.target.checked
                  if (on) {
                    setTrackAutoAlign(track.id, true)
                    void (async () => {
                      try {
                        setError(null)
                        await autoAlignTracksFromCounts()
                      } catch (error) {
                        setError(
                          error instanceof Error
                            ? error.message
                            : 'Calage auto impossible.',
                        )
                      }
                    })()
                    return
                  }
                  applyManualTrackOffset(track.id, 0)
                }}
              />
              <span className="track-check-box" aria-hidden="true" />
            </label>
          )}
          <div className="track-nudge" title="Décaler cette piste à la lecture">
            <button
              type="button"
              className="btn btn-nudge"
              data-nudge-track={track.id}
              data-nudge="-5"
              aria-label={`Avancer ${track.name} de 5 ms`}
              onClick={() =>
                applyManualTrackOffset(
                  track.id,
                  Math.round(track.offsetMs - 5),
                )
              }
            >
              −
            </button>
            <label className="track-offset-wrap">
              <input
                type="text"
                className="track-offset"
                data-offset-track={track.id}
                value={offsetDraft}
                inputMode="numeric"
                aria-label={`Calage de ${track.name} en millisecondes`}
                spellCheck={false}
                onChange={(event) => setOffsetDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    event.currentTarget.blur()
                  }
                }}
                onFocus={(event) => {
                  event.currentTarget.select()
                  event.currentTarget.addEventListener(
                    'mouseup',
                    (mouseupEvent) => {
                      mouseupEvent.preventDefault()
                      event.currentTarget.select()
                    },
                    { once: true },
                  )
                }}
                onBlur={() => {
                  const parsed = parseOffsetMsInput(offsetDraft)
                  const next = parsed ?? Math.round(track.offsetMs)
                  setOffsetDraft(String(next))
                  if (next !== track.offsetMs) {
                    applyManualTrackOffset(track.id, next)
                  }
                }}
              />
              <span className="track-offset-unit" aria-hidden="true">
                ms
              </span>
            </label>
            <button
              type="button"
              className="btn btn-nudge"
              data-nudge-track={track.id}
              data-nudge="5"
              aria-label={`Retarder ${track.name} de 5 ms`}
              onClick={() =>
                applyManualTrackOffset(
                  track.id,
                  Math.round(track.offsetMs + 5),
                )
              }
            >
              +
            </button>
          </div>
          <small
            className={`track-align-detail${alignDetailText ? '' : ' is-empty'}`}
          >
            {alignDetailText || '\u00a0'}
          </small>
        </>
      ) : null}
    </li>
  )
}
