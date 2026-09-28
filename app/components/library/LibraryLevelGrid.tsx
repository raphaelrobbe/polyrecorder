import { useNavigate } from '@remix-run/react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocale } from '../../hooks/useLocale'
import { formatTime } from '../../lib/format'
import { t, tp } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { Button } from '../Button'
import { IconDragDots, IconTrash } from '../icons'
import { SongShareButton } from './SongOwnerToolbar'

export type LibraryLevelItem = {
  id: string
  title: string
  /** Secondary line (counts, meta). */
  meta?: string
  /** Track name chips under a session row. */
  trackNames?: string[]
  /** Session mix length in ms — shown next to the title as MM:SS. */
  durationMs?: number
  to: string
  /** Allow empty name (sessions); shows placeholder when empty. */
  allowEmptyTitle?: boolean
  titlePlaceholder?: string
  /** When set, show a share control for this session row. */
  share?: {
    songPartId: string
    songName: string
    isPublic: boolean
  }
}

type LibraryLevelGridProps = {
  items: LibraryLevelItem[]
  emptyLabel: string
  addLabel?: string
  onAdd?: () => void
  onRename?: (item: LibraryLevelItem, name: string) => void
  onDelete?: (item: LibraryLevelItem) => void
  /** Persist reorder: move `id` before `beforeId` (null = end). */
  onReorder?: (id: string, beforeId: string | null) => void
  canEdit?: boolean
  /** Shared parent id for sibling drag scope (any stable string for this level). */
  parentId?: string
  /**
   * Brand border cycle: groups/songs go 1→8; repertoires/sessions go 8→1
   * so short lists don’t look all-blue.
   */
  brandBorderDir?: 'asc' | 'desc'
  className?: string
  trailing?: ReactNode
}

function brandBorderVar(index: number, dir: 'asc' | 'desc'): string {
  const step = index % 8
  const n = dir === 'asc' ? step + 1 : 8 - step
  return `var(--brand-${n})`
}

type DragInfo = { id: string; parentId: string }
type DragOver = { id: string; edge: 'before' | 'after' } | null

const TOUCH_REORDER_THRESHOLD_PX = 8
const LEVEL_PARENT = '__level__'

function moveBefore(
  ids: string[],
  id: string,
  beforeId: string | null,
): string[] | null {
  if (!ids.includes(id)) return null
  if (beforeId != null && !ids.includes(beforeId)) return null
  const rest = ids.filter((candidate) => candidate !== id)
  if (beforeId == null) return [...rest, id]
  const index = rest.indexOf(beforeId)
  return [...rest.slice(0, index), id, ...rest.slice(index)]
}

function dropTargetFromPoint(
  root: HTMLElement,
  drag: DragInfo,
  clientY: number,
): DragOver {
  for (const row of root.querySelectorAll<HTMLElement>('[data-library-id]')) {
    if (row.dataset.libraryParent !== drag.parentId) continue
    const id = row.dataset.libraryId
    if (!id || id === drag.id) continue
    const rect = row.getBoundingClientRect()
    if (clientY < rect.top || clientY > rect.bottom) continue
    return {
      id,
      edge: clientY < rect.top + rect.height / 2 ? 'before' : 'after',
    }
  }
  return null
}

function dragRowClass(isDragging: boolean, dragOver: 'before' | 'after' | null) {
  return cn(
    isDragging && 'opacity-45',
    dragOver === 'before' &&
      'before:pointer-events-none before:absolute before:left-0 before:right-0 before:-top-[0.25rem] before:h-0.5 before:rounded-sm before:bg-ink before:content-[""]',
    dragOver === 'after' &&
      'after:pointer-events-none after:absolute after:bottom-[-0.25rem] after:left-0 after:right-0 after:h-0.5 after:rounded-sm after:bg-ink after:content-[""]',
  )
}

function LibraryDragHandle({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  useLocale()
  const label = t('library.reorder', { name })
  return (
    <button
      type="button"
      draggable
      data-library-drag
      className={cn(
        'pointer-events-auto m-0 grid h-[1.75rem] w-[1.1rem] shrink-0 place-items-center rounded-md border-0 bg-transparent p-0',
        'cursor-grab text-ink-soft opacity-60 touch-none',
        'hover:bg-ink/6 hover:text-ink hover:opacity-100 active:cursor-grabbing',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
        className,
      )}
      aria-label={label}
      title={label}
      onClick={(event) => event.stopPropagation()}
    >
      <IconDragDots className="size-[1.2rem]" />
    </button>
  )
}

/** Same rename field as the former library accordion. */
function LibraryNameInput({
  value,
  ariaLabel,
  className,
  onCommit,
  placeholder,
  allowEmpty = false,
}: {
  value: string
  ariaLabel: string
  className?: string
  onCommit: (next: string) => void
  placeholder?: string
  allowEmpty?: boolean
}) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const showPlaceholderStyle =
    allowEmpty && !draft.trim() && Boolean(placeholder)

  return (
    <input
      type="text"
      value={draft}
      placeholder={placeholder}
      aria-label={ariaLabel}
      maxLength={80}
      spellCheck={false}
      className={cn(
        'relative z-[1] m-0 w-auto max-w-full min-w-[5.5ch] rounded-[8px] border-0 bg-transparent py-[0.1rem] pl-[0.25rem] pr-9 font-[inherit] text-inherit field-sizing-content',
        'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none',
        'focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
        className,
        showPlaceholderStyle &&
          'italic text-ink-soft [font-synthesis:style] placeholder:italic placeholder:text-ink-soft',
      )}
      onChange={(event) => setDraft(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          event.currentTarget.blur()
        }
        if (event.key === 'Escape') {
          setDraft(value)
          event.currentTarget.blur()
        }
      }}
      onBlur={() => {
        const next = allowEmpty ? draft.trim() : draft.trim() || value
        setDraft(next)
        if (next !== value) onCommit(next)
      }}
    />
  )
}

export function LibraryLevelGrid({
  items,
  emptyLabel,
  addLabel,
  onAdd,
  onRename,
  onDelete,
  onReorder,
  canEdit = false,
  parentId = LEVEL_PARENT,
  brandBorderDir = 'asc',
  className,
  trailing,
}: LibraryLevelGridProps) {
  useLocale()
  const navigate = useNavigate()
  const listRef = useRef<HTMLUListElement>(null)
  const dragInfoRef = useRef<DragInfo | null>(null)
  const touchDragRef = useRef<{
    pointerId: number
    info: DragInfo
    startY: number
    active: boolean
  } | null>(null)
  const [orderedItems, setOrderedItems] = useState(items)
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null)
  const [dragOver, setDragOver] = useState<DragOver>(null)

  useEffect(() => {
    setOrderedItems(items)
  }, [items])

  const canReorder = Boolean(canEdit && onReorder && orderedItems.length > 1)

  const clearDragState = useCallback(() => {
    dragInfoRef.current = null
    touchDragRef.current = null
    setDragInfo(null)
    setDragOver(null)
  }, [])

  const updateDragOverFromPoint = useCallback((clientY: number) => {
    const info = dragInfoRef.current
    const root = listRef.current
    if (!info || !root) return
    setDragOver(dropTargetFromPoint(root, info, clientY))
  }, [])

  const commitDragFromPoint = useCallback(
    (clientY: number) => {
      const info = dragInfoRef.current
      const root = listRef.current
      const target =
        info && root ? dropTargetFromPoint(root, info, clientY) : null
      clearDragState()
      if (!info || !target || !onReorder) return

      const ids = orderedItems.map((item) => item.id)
      const targetIndex = ids.indexOf(target.id)
      if (targetIndex < 0) return
      const beforeId =
        target.edge === 'before'
          ? target.id
          : (ids[targetIndex + 1] ?? null)
      if (beforeId === info.id) return
      const ordered = moveBefore(ids, info.id, beforeId)
      if (!ordered) return

      setOrderedItems((prev) =>
        [...prev].sort(
          (a, b) => ordered.indexOf(a.id) - ordered.indexOf(b.id),
        ),
      )
      onReorder(info.id, beforeId)
    },
    [clearDragState, onReorder, orderedItems],
  )

  return (
    <div className={cn('flex flex-col gap-[0.65rem]', className)}>
      {orderedItems.length === 0 ? (
        <p className="m-0 py-4 text-center text-[0.9rem] text-ink-soft">
          {emptyLabel}
        </p>
      ) : (
        <ul
          ref={listRef}
          className="m-0 flex list-none flex-col gap-[0.55rem] p-0"
          onDragStart={(event) => {
            if (!canReorder) return
            const target = event.target
            if (!(target instanceof Element)) return
            const handle = target.closest<HTMLElement>('[data-library-drag]')
            if (!handle || !event.dataTransfer) return
            const row = handle.closest<HTMLElement>('[data-library-id]')
            const id = row?.dataset.libraryId
            if (!id) return
            touchDragRef.current = null
            const info = { id, parentId }
            dragInfoRef.current = info
            setDragInfo(info)
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', id)
          }}
          onDragEnd={() => clearDragState()}
          onDragOver={(event) => {
            if (!dragInfoRef.current) return
            event.preventDefault()
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
            updateDragOverFromPoint(event.clientY)
          }}
          onDrop={(event) => {
            if (!dragInfoRef.current) return
            event.preventDefault()
            commitDragFromPoint(event.clientY)
          }}
          onPointerDown={(event) => {
            if (!canReorder) return
            if (event.pointerType === 'mouse') return
            if (!(event.target instanceof Element)) return
            const handle =
              event.target.closest<HTMLElement>('[data-library-drag]')
            if (!handle) return
            const row = handle.closest<HTMLElement>('[data-library-id]')
            const id = row?.dataset.libraryId
            if (!id) return
            touchDragRef.current = {
              pointerId: event.pointerId,
              info: { id, parentId },
              startY: event.clientY,
              active: false,
            }
          }}
          onPointerMove={(event) => {
            const touch = touchDragRef.current
            if (!touch || touch.pointerId !== event.pointerId) return
            if (!touch.active) {
              if (
                Math.abs(event.clientY - touch.startY) <
                TOUCH_REORDER_THRESHOLD_PX
              ) {
                return
              }
              touch.active = true
              dragInfoRef.current = touch.info
              setDragInfo(touch.info)
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
            const touch = touchDragRef.current
            if (!touch || touch.pointerId !== event.pointerId) return
            if (touch.active) {
              commitDragFromPoint(event.clientY)
              return
            }
            touchDragRef.current = null
          }}
          onPointerCancel={() => {
            if (!touchDragRef.current) return
            clearDragState()
          }}
        >
          {orderedItems.map((item, index) => {
            const displayTitle = item.title.trim()
              ? item.title
              : (item.titlePlaceholder ?? item.title)
            return (
              <li
                key={item.id}
                data-library-id={item.id}
                data-library-parent={parentId}
                className={cn(
                  'relative rounded-[16px] border-[1.5px] bg-surface py-[0.95rem] pr-[1.05rem] transition-[background,opacity] duration-160 hover:bg-ink/5',
                  canReorder ? 'pl-[0.35rem]' : 'pl-[1.05rem]',
                  dragRowClass(
                    dragInfo?.id === item.id,
                    dragOver?.id === item.id ? dragOver.edge : null,
                  ),
                )}
                style={{
                  borderColor: brandBorderVar(index, brandBorderDir),
                }}
              >
                <button
                  type="button"
                  aria-label={displayTitle}
                  className={cn(
                    'absolute inset-0 z-0 m-0 cursor-pointer rounded-[16px] border-0 bg-transparent p-0',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
                  )}
                  onClick={() => navigate(item.to)}
                />
                <div className="relative z-[1] flex min-w-0 items-center gap-1 pointer-events-none">
                  {canReorder ? (
                    <LibraryDragHandle name={displayTitle} />
                  ) : null}
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-[0.2rem]">
                    <div className="flex min-w-0 max-w-full flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      {canEdit && onRename ? (
                        <LibraryNameInput
                          value={item.title}
                          ariaLabel={t('library.rename')}
                          placeholder={item.titlePlaceholder}
                          allowEmpty={Boolean(item.allowEmptyTitle)}
                          className="pointer-events-auto text-[1.05rem] font-bold leading-[1.25] text-ink"
                          onCommit={(name) => onRename(item, name)}
                        />
                      ) : (
                        <span className="pl-[0.25rem] text-[1.05rem] font-bold leading-[1.25] text-ink">
                          {displayTitle}
                        </span>
                      )}
                      {item.durationMs != null && item.durationMs > 0 ? (
                        <span className="shrink-0 tabular-nums text-[0.78rem] font-semibold leading-none text-ink-soft">
                          {formatTime(item.durationMs)}
                        </span>
                      ) : null}
                    </div>
                    {item.meta ? (
                      <span className="pl-[0.25rem] text-[0.78rem] font-semibold leading-[1.3] text-ink-soft">
                        {item.meta}
                      </span>
                    ) : null}
                    {item.trackNames ? (
                      item.trackNames.length > 0 ? (
                        <span className="mt-0.5 flex flex-wrap gap-1 pl-[0.25rem]">
                          {item.trackNames.map((trackName, index) => (
                            <span
                              key={`${trackName}-${index}`}
                              className="inline-flex max-w-full truncate rounded-[7px] bg-ink/[0.06] px-[0.45rem] py-[0.18rem] text-[0.68rem] font-semibold leading-none text-ink-soft"
                            >
                              {trackName}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="mt-0.5 block pl-[0.25rem] text-[0.75rem] font-normal leading-none text-ink-soft">
                          {tp(
                            'library.count.track.one',
                            'library.count.track.other',
                            0,
                          )}
                        </span>
                      )
                    ) : null}
                  </div>
                  {item.share ? (
                    <div className="pointer-events-auto shrink-0">
                      <SongShareButton
                        songPartId={item.share.songPartId}
                        songName={item.share.songName}
                        isPublic={item.share.isPublic}
                      />
                    </div>
                  ) : null}
                  {canEdit && onDelete ? (
                    <Button
                      type="button"
                      variant="trash"
                      className="pointer-events-auto relative z-[1] shrink-0 border-ink/20 text-ink/60 [&_svg]:size-[1.05rem]"
                      icon={<IconTrash />}
                      aria-label={t('library.delete')}
                      title={t('library.delete')}
                      onClick={(event) => {
                        event.stopPropagation()
                        onDelete(item)
                      }}
                    />
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {canEdit && onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          aria-label={addLabel}
          title={addLabel}
          className={cn(
            'mt-[0.15rem] flex min-h-[3.4rem] w-full items-center justify-center rounded-[16px] border-[1.5px] border-dashed border-ink/22 bg-transparent',
            'text-[1.65rem] font-normal leading-none text-ink/45',
            'cursor-pointer transition-[background,border-color,color] duration-160',
            'hover:border-ink/35 hover:bg-ink/5 hover:text-ink',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
          )}
        >
          +
        </button>
      ) : null}
      {trailing}
    </div>
  )
}
