import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@remix-run/react'
import { formatCentis, getMixDurationMs } from '../../lib/format'
import {
  alignableTracks,
  cancelContentSyncPick,
  cancelReferencePick,
  deleteAllTracks,
  dismissMixClipWarning,
  getMixPositionMs,
  realignAllTracks,
  reorderTrack,
  seekMixTo,
  setAllTracksEnabled,
  setError,
  setMasterVolume,
  flushVolumeCloudPersist,
} from '../../lib/sessionActions.client'
import { MASTER_VOLUME_MAX } from '../../lib/audio/mix.client'
import { useLocale } from '../../hooks/useLocale'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { useSessionStore } from '../../store/sessionStore'
import { Button } from '../Button'
import { contentSyncPunchHelpPath } from '../ContentSyncInviteBanner'
import { IconAutoAlign, IconTrash } from '../icons'
import { NoticeBanner } from '../StatusMessage'
import { VolumeRibbon } from '../VolumeRibbon'
import { CutModePanel } from '../CutModePanel'
import { TrackMute } from './TrackMute'
import { TrackRow } from './TrackRow'

const TOUCH_REORDER_THRESHOLD_PX = 8
const TOUCH_REORDER_EXCLUDE =
  'input, textarea, select, button:not([data-drag-track]), [data-track-mute], [data-rename-track], [data-ms-nudge], [data-offset-track], [data-delete-track], [data-delete-all-tracks], [data-nudge-track], [data-auto-align-track], [data-align-all], [data-toggle-track], [data-highlight-track], [data-volume-ribbon], [data-volume-percent], [data-cut-select-track], [data-cut-segment], [data-content-sync], [data-content-sync-pick], [data-content-sync-target], [data-reference-pick], [data-track-pick-target]'

type DragOverState = { trackId: number; edge: 'before' | 'after' } | null

type TracksListProps = {
  className?: string
}

export function TracksList({ className }: TracksListProps) {
  useLocale()
  const tracks = useSessionStore((s) => s.tracks)
  const state = useSessionStore((s) => s.state)
  const calageMode = useSessionStore((s) => s.calageMode)
  const mixMode = useSessionStore((s) => s.mixMode)
  const cutMode = useSessionStore((s) => s.cutMode)
  const cutPhase = useSessionStore((s) => s.cutPhase)
  const autoAlignEnabled = useSessionStore((s) => s.autoAlignEnabled)
  const masterVolume = useSessionStore((s) => s.masterVolume)
  const mixClipWarning = useSessionStore((s) => s.mixClipWarning)
  const enabledTrackIds = useSessionStore((s) => s.enabledTrackIds)
  const mixClockText = useSessionStore((s) => s.mixClockText)
  const mixSeekMs = useSessionStore((s) => s.mixSeekMs)
  const cutMerging = useSessionStore((s) => s.cutMerging)
  const contentSyncPickFromId = useSessionStore((s) => s.contentSyncPickFromId)
  const referencePickActive = useSessionStore((s) => s.referencePickActive)
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

  useEffect(() => {
    if (contentSyncPickFromId == null && !referencePickActive) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelContentSyncPick()
        cancelReferencePick()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [contentSyncPickFromId, referencePickActive])

  const alignable = alignableTracks()
  const selectedCount = enabledTrackIds.length
  const allSelected = tracks.length > 0 && selectedCount === tracks.length
  const masterMuteIndeterminate =
    selectedCount > 0 && selectedCount < tracks.length
  const hasDeletableTracks = tracks.length > 0
  const cutEditing = cutMode && cutPhase === 'edit'
  const modeLocksReorder = calageMode || mixMode || cutEditing
  const compactTrackChrome = calageMode || mixMode || cutEditing

  const duration = getMixDurationMs(tracks)
  const seekStepSeconds =
    duration < 10_000 ? 0 : duration <= 30_000 ? 5 : 10
  const seekStepMs = seekStepSeconds * 1000
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

  return (
    <>
      <div
        className={cn('relative mt-3 pt-[0.35rem]', className)}
        data-tracks-panel
      >
        <p className="mb-[0.35rem] mt-0 text-center text-[0.95rem] font-bold tracking-[0.04em] tabular-nums text-ink-soft" data-mix-clock>
          {mixClockText}
        </p>
        <div
          className="mb-[0.85rem] flex items-center gap-[0.35rem] max-sm:gap-[0.25rem]"
          role="group"
          aria-label={t('mix.seekAria')}
        >
          {seekStepSeconds > 0 ? (
            <Button
              type="button"
              variant="utility"
              className="shrink-0 px-[0.3rem] py-[0.18rem] text-[0.66rem] font-semibold tabular-nums tracking-[0.02em] text-ink/45 hover:text-ink-soft"
              disabled={state === 'recording' || cutMerging}
              title={t('mix.seek.back.hint', { seconds: seekStepSeconds })}
              aria-label={t('mix.seek.back.aria', { seconds: seekStepSeconds })}
              onClick={() => void seekMixTo(getMixPositionMs() - seekStepMs)}
            >
              {t('mix.seek.back', { seconds: seekStepSeconds })}
            </Button>
          ) : null}
          <div
            className="relative min-w-0 flex-1 h-[0.55rem] cursor-pointer touch-none rounded-full bg-ink/10 after:pointer-events-none after:absolute after:top-1/2 after:left-[var(--seek-thumb,0%)] after:h-[0.7rem] after:w-[0.7rem] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border-2 after:border-paper after:bg-ink after:opacity-0 after:shadow-[0_1px_3px_color-mix(in_srgb,var(--ink)_20%,transparent)] after:content-[''] hover:after:opacity-100 focus-visible:after:opacity-100"
            data-mix-seek
            role="slider"
            tabIndex={0}
            aria-label={t('mix.seekAria')}
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
          {seekStepSeconds > 0 ? (
            <Button
              type="button"
              variant="utility"
              className="shrink-0 px-[0.3rem] py-[0.18rem] text-[0.66rem] font-semibold tabular-nums tracking-[0.02em] text-ink/45 hover:text-ink-soft"
              disabled={state === 'recording' || cutMerging}
              title={t('mix.seek.forward.hint', { seconds: seekStepSeconds })}
              aria-label={t('mix.seek.forward.aria', {
                seconds: seekStepSeconds,
              })}
              onClick={() => void seekMixTo(getMixPositionMs() + seekStepMs)}
            >
              {t('mix.seek.forward', { seconds: seekStepSeconds })}
            </Button>
          ) : null}
        </div>
        {calageMode && alignable.length > 0 ? (
          <p
            className="mb-[0.55rem] mt-[-0.45rem] text-[0.68rem] leading-[1.3] text-ink-soft max-sm:text-[0.64rem]"
            data-align-legend
          >
            {t('tracks.align.legend')}
          </p>
        ) : null}
        {mixMode ? (
          <div className="mb-[0.75rem] flex flex-col gap-[0.35rem]">
            <div
              className="flex items-center gap-[0.55rem] max-sm:gap-[0.35rem]"
              data-volume-ribbon
            >
              <span className="shrink-0 text-[0.84rem] font-semibold text-ink-soft max-sm:text-[0.76rem]">
                {t('mix.masterVolume')}
              </span>
              <VolumeRibbon
                className="min-w-0 flex-auto"
                emphasis
                label={t('mix.masterVolume')}
                value={masterVolume}
                max={MASTER_VOLUME_MAX}
                onChange={setMasterVolume}
                onChangeEnd={() => flushVolumeCloudPersist()}
                onReset={() => setMasterVolume(1)}
              />
            </div>
            {mixClipWarning ? (
              <NoticeBanner
                tone="mix"
                compact
                className="m-0 mt-0"
                onDismiss={() => dismissMixClipWarning()}
              >
                {t('mix.clip.bus')}
              </NoticeBanner>
            ) : null}
          </div>
        ) : null}
        {cutMode ? <CutModePanel /> : null}
        {calageMode && alignable.length > 0 ? (
          <div
            className={cn(
              'mb-[0.08rem] grid items-end gap-x-[0.1rem] pl-[0.35rem]',
              autoAlignEnabled
                ? 'grid-cols-[1.55rem_minmax(0,1fr)_2.6rem_7.1rem] max-sm:grid-cols-[1.4rem_minmax(0,1fr)_2.3rem_6rem]'
                : 'grid-cols-[1.55rem_minmax(0,1fr)_7.1rem] max-sm:grid-cols-[1.4rem_minmax(0,1fr)_6rem]',
            )}
            aria-hidden="true"
          >
            <span className="col-start-1" />
            <span className="col-start-2" />
            {autoAlignEnabled ? (
              <span
                className="col-start-3 text-center text-[0.58rem] font-extrabold uppercase tracking-[0.06em] text-ink-soft select-none"
                title={t('tracks.alignAll.hint')}
              >
                {t('tracks.alignCol')}
              </span>
            ) : null}
            <span
              className={cn(
                'text-center text-[0.58rem] font-extrabold uppercase tracking-[0.06em] text-ink-soft select-none',
                autoAlignEnabled ? 'col-start-4' : 'col-start-3',
              )}
              title={t('tracks.offset.hint')}
            >
              {t('tracks.offsetCol')}
            </span>
          </div>
        ) : null}
        <div
          className={cn(
            'mb-[0.45rem] grid min-h-[2rem] items-center gap-x-[0.1rem] pl-[0.35rem]',
            compactTrackChrome
              ? 'grid-cols-[1.55rem_minmax(0,1fr)] max-sm:grid-cols-[1.4rem_minmax(0,1fr)]'
              : 'grid-cols-[1.35rem_1.55rem_minmax(0,1fr)] max-sm:grid-cols-[1.2rem_1.4rem_minmax(0,1fr)]',
            calageMode &&
              alignable.length > 0 &&
              autoAlignEnabled &&
              'mb-[0.2rem] grid-cols-[1.55rem_minmax(0,1fr)_2.6rem_7.1rem] max-sm:grid-cols-[1.4rem_minmax(0,1fr)_2.3rem_6rem]',
            calageMode &&
              alignable.length > 0 &&
              !autoAlignEnabled &&
              'mb-[0.2rem] grid-cols-[1.55rem_minmax(0,1fr)_7.1rem] max-sm:grid-cols-[1.4rem_minmax(0,1fr)_6rem]',
          )}
        >
          {compactTrackChrome ? null : (
            <span className="col-start-1" aria-hidden="true" />
          )}
          <TrackMute
            className={cn(
              'justify-self-center',
              compactTrackChrome ? 'col-start-1' : 'col-start-2',
            )}
            title={t('tracks.muteAll.hint')}
            ariaLabel={t('tracks.muteAll.aria')}
            checked={allSelected}
            indeterminate={masterMuteIndeterminate}
            onCheckedChange={(on) => setAllTracksEnabled(on)}
            inputProps={{ 'data-select-all': true }}
          />
          <div
            className={cn(
              'flex w-full min-w-0 items-center justify-end py-[0.2rem] pr-[0.45rem] pl-[0.35rem] max-sm:pr-[0.3rem] max-sm:pl-[0.2rem]',
              compactTrackChrome ? 'col-start-2' : 'col-start-3',
            )}
          >
            <Button
              variant="trash"
              className="h-[1.75rem] w-[1.75rem] shrink-0 rounded-lg border-ink/18 text-ink/55 [&_svg]:size-[0.88rem]"
              icon={<IconTrash />}
              aria-label={t('tracks.deleteAll')}
              title={t('tracks.deleteAll')}
              hidden={compactTrackChrome || !hasDeletableTracks}
              disabled={state === 'recording' || !hasDeletableTracks}
              onClick={() => {
                const count = tracks.length
                const ok = window.confirm(
                  count === 1
                    ? t('tracks.deleteOne.confirm', {
                        name: tracks[0]!.name,
                      })
                    : t('tracks.deleteAll.confirm', { count }),
                )
                if (!ok) return
                deleteAllTracks()
              }}
            />
          </div>
          {calageMode && autoAlignEnabled && alignable.length > 0 ? (
            <Button
              variant="nudge"
              className="col-start-3 justify-self-center [&_svg]:size-[1.28rem]"
              icon={<IconAutoAlign />}
              disabled={alignable.length === 0}
              title={t('tracks.alignAll.hint')}
              aria-label={t('tracks.alignAll.aria')}
              data-align-all
              data-align-header
              onClick={() => {
                void (async () => {
                  try {
                    await realignAllTracks()
                  } catch (error) {
                    setError(
                      error instanceof Error
                        ? error.message
                        : t('error.autoAlignFailed'),
                    )
                  }
                })()
              }}
            />
          ) : null}
          <span
            className={cn(
              'w-full shrink-0 justify-self-center',
              calageMode && autoAlignEnabled
                ? 'col-start-4'
                : 'col-start-3',
            )}
            data-align-nudge-spacer
            hidden={!calageMode || alignable.length === 0}
            aria-hidden="true"
          />
        </div>
        {contentSyncPickFromId != null ? (
          <ContentSyncPickBanner />
        ) : null}
        {referencePickActive ? (
          <div
            className={cn(
              'mb-[0.35rem] flex items-center gap-[0.65rem] rounded-[14px] border-[1.5px] border-mode-align-border bg-mode-align-bg',
              'px-[0.75rem] py-[0.55rem] text-[0.8rem] font-semibold leading-[1.3] text-mode-align animate-rise',
            )}
            role="status"
            data-reference-pick-banner
          >
            <span className="min-w-0 flex-auto">
              {t('tracks.ref.pickHint')}
            </span>
            <Button
              type="button"
              variant="trim"
              className="shrink-0 border-mode-align-border bg-transparent px-[0.55rem] py-[0.22rem] text-[0.72rem] text-mode-align hover:enabled:bg-mode-align-hover"
              onClick={() => cancelReferencePick()}
            >
              {t('tracks.ref.pickCancel')}
            </Button>
          </div>
        ) : null}
        <ul
          className={cn(
            'm-0 flex list-none flex-col gap-[0.3rem] p-0',
            calageMode && 'gap-[0.1rem]',
          )}
          data-tracks
          ref={listRef}
          onDragStart={(event) => {
            if (modeLocksReorder) return
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
            if (modeLocksReorder) return
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
            if (modeLocksReorder) return
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
    </>
  )
}

/** Banner while picking a content-sync target (+ “?” → punch-in help). */
function ContentSyncPickBanner() {
  useLocale()
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        'mb-[0.35rem] flex flex-col gap-[0.45rem] rounded-[14px] border-[1.5px] border-mode-simple-border bg-mode-simple-bg',
        'px-[0.75rem] py-[0.55rem] text-mode-simple animate-rise',
      )}
      role="status"
      data-content-sync-banner
    >
      <div className="flex items-center gap-[0.65rem]">
        <span className="min-w-0 flex-auto text-[0.8rem] font-semibold leading-[1.3]">
          {t('tracks.contentSync.pickHint')}
        </span>
        <Button
          type="button"
          variant="round"
          className="h-[1.25rem] w-[1.25rem] shrink-0 border-mode-simple-border text-[0.72rem] font-bold text-mode-simple hover:enabled:border-mode-simple hover:enabled:bg-mode-simple-hover max-sm:h-[1.15rem] max-sm:w-[1.15rem] max-sm:text-[0.68rem]"
          title={t('tracks.contentSync.invite.help')}
          aria-label={t('tracks.contentSync.invite.help')}
          onClick={(event) => {
            event.stopPropagation()
            navigate(contentSyncPunchHelpPath())
          }}
        >
          ?
        </Button>
        <Button
          type="button"
          variant="trim"
          className="shrink-0 border-mode-simple-border bg-transparent px-[0.55rem] py-[0.22rem] text-[0.72rem] text-mode-simple hover:enabled:bg-mode-simple-hover"
          onClick={() => cancelContentSyncPick()}
        >
          {t('tracks.contentSync.pickCancel')}
        </Button>
      </div>
    </div>
  )
}
