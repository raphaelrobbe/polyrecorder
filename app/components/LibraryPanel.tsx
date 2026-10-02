import { useNavigate, useRouteLoaderData } from '@remix-run/react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useLocale } from '../hooks/useLocale'
import { readAlignPrefs } from '../lib/alignPrefs'
import { LIBRARY_TITLE_MAX_LEN } from '../lib/format'
import { t, tp } from '../lib/i18n'
import { clearLocalDeckSession, loadCloudSongIntoSession, refreshOpenDeckForSong, syncDeckLabelsAfterLibraryRename } from '../lib/sessionActions.client'
import { librarySessionPath } from '../lib/libraryPaths'
import { cn } from '../lib/utils'
import type { loader as rootLoader } from '../root'
import { useSessionStore } from '../store/sessionStore'
import { Button } from './Button'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import {
  IconChevron,
  IconCollaborate,
  IconDragDots,
  IconDuplicate,
  IconGlobe,
  IconShare,
  IconTrash,
} from './icons'
import { ErrorBanner } from './StatusMessage'
import { MoveSongPartMenu } from './library/MoveSongPartMenu'

type LibrarySongPart = {
  id: string
  name: string | null
  trackNames: string[]
  lastOpenedAt: string
  updatedAt: string
}

type LibrarySong = {
  id: string
  name: string
  isPublic: boolean
  allowsCollaboration: boolean
  lastOpenedAt: string
  updatedAt: string
  parts: LibrarySongPart[]
}

type LibraryTree = {
  groups: Array<{
    id: string
    name: string
    repertoires: Array<{
      id: string
      name: string
      songs: LibrarySong[]
    }>
  }>
}

type LibraryPanelProps = {
  className?: string
}

type NodeKind = 'group' | 'repertoire' | 'song' | 'songPart'

/** Row being dragged: reordering never leaves `parentId`. */
type DragInfo = { kind: NodeKind; id: string; parentId: string }

type DragOver = { id: string; edge: 'before' | 'after' } | null

/** What the rows need to paint the drag feedback. */
type DragRender = { draggingId: string | null; dragOver: DragOver }

/** Groups have no parent row — they all share this bucket. */
const ROOT_PARENT_ID = 'root'

const TOUCH_REORDER_THRESHOLD_PX = 8

async function postLibrary(body: Record<string, unknown>) {
  const res = await fetch('/api/cloud/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<{
    ok: boolean
    reason?: string
    id?: string
    defaultPartId?: string
  }>
}

function findActivePath(
  tree: LibraryTree,
  activeSongPartId: string | null,
): { groupId: string; repertoireId: string; songId: string } | null {
  if (!activeSongPartId) return null
  for (const group of tree.groups) {
    for (const rep of group.repertoires) {
      for (const song of rep.songs) {
        if (song.parts.some((part) => part.id === activeSongPartId)) {
          return {
            groupId: group.id,
            repertoireId: rep.id,
            songId: song.id,
          }
        }
      }
    }
  }
  return null
}

function findSongPath(
  tree: LibraryTree,
  songId: string,
): { groupId: string; repertoireId: string; songId: string } | null {
  for (const group of tree.groups) {
    for (const rep of group.repertoires) {
      if (rep.songs.some((song) => song.id === songId)) {
        return {
          groupId: group.id,
          repertoireId: rep.id,
          songId,
        }
      }
    }
  }
  return null
}

/** Part used by the share link: the active one, else the latest opened. */
function shareTargetPartId(
  song: LibrarySong,
  activeSongPartId: string | null,
): string | null {
  const active = song.parts.find((part) => part.id === activeSongPartId)
  if (active) return active.id
  const latest = [...song.parts].sort((a, b) =>
    b.lastOpenedAt.localeCompare(a.lastOpenedAt),
  )[0]
  return latest?.id ?? null
}

/** Sibling ids of one parent, in display order. */
function siblingIds(
  tree: LibraryTree,
  kind: NodeKind,
  parentId: string,
): string[] {
  if (kind === 'group') return tree.groups.map((group) => group.id)
  if (kind === 'repertoire') {
    const group = tree.groups.find((candidate) => candidate.id === parentId)
    return group?.repertoires.map((rep) => rep.id) ?? []
  }
  const reps = tree.groups.flatMap((group) => group.repertoires)
  if (kind === 'song') {
    const rep = reps.find((candidate) => candidate.id === parentId)
    return rep?.songs.map((song) => song.id) ?? []
  }
  const song = reps
    .flatMap((rep) => rep.songs)
    .find((candidate) => candidate.id === parentId)
  return song?.parts.map((part) => part.id) ?? []
}

/** Sibling ids with `id` moved before `beforeId` (to the end when null). */
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

/** Optimistic reorder of one sibling list inside the local tree. */
function applyLocalReorder(
  tree: LibraryTree,
  kind: NodeKind,
  parentId: string,
  ordered: string[],
): LibraryTree {
  const sorted = <T extends { id: string }>(items: T[]): T[] =>
    [...items].sort((a, b) => ordered.indexOf(a.id) - ordered.indexOf(b.id))

  if (kind === 'group') return { groups: sorted(tree.groups) }
  return {
    groups: tree.groups.map((group) => {
      if (kind === 'repertoire') {
        return group.id === parentId
          ? { ...group, repertoires: sorted(group.repertoires) }
          : group
      }
      return {
        ...group,
        repertoires: group.repertoires.map((rep) => {
          if (kind === 'song') {
            return rep.id === parentId ? { ...rep, songs: sorted(rep.songs) } : rep
          }
          return {
            ...rep,
            songs: rep.songs.map((song) =>
              song.id === parentId ? { ...song, parts: sorted(song.parts) } : song,
            ),
          }
        }),
      }
    }),
  }
}

function isNodeKind(value: string | undefined): value is NodeKind {
  return (
    value === 'group' ||
    value === 'repertoire' ||
    value === 'song' ||
    value === 'songPart'
  )
}

/** The row a drag handle belongs to, read from its `data-library-*` set. */
function dragInfoFromHandle(handle: HTMLElement): DragInfo | null {
  const row = handle.closest<HTMLElement>('[data-library-id]')
  if (!row) return null
  const { libraryKind, libraryId, libraryParent } = row.dataset
  if (!isNodeKind(libraryKind) || !libraryId || !libraryParent) return null
  return { kind: libraryKind, id: libraryId, parentId: libraryParent }
}

/** Row under the pointer, restricted to the dragged row's own sibling list. */
function dropTargetFromPoint(
  root: HTMLElement,
  drag: DragInfo,
  clientY: number,
): DragOver {
  for (const row of root.querySelectorAll<HTMLElement>('[data-library-id]')) {
    if (row.dataset.libraryKind !== drag.kind) continue
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

/** Dimming + insertion indicator, matching the track rows. */
function dragRowClass(isDragging: boolean, dragOver: 'before' | 'after' | null) {
  return cn(
    isDragging && 'opacity-45',
    dragOver === 'before' &&
      'before:pointer-events-none before:absolute before:left-0 before:right-0 before:-top-[0.25rem] before:h-0.5 before:rounded-sm before:bg-ink before:content-[""]',
    dragOver === 'after' &&
      'after:pointer-events-none after:absolute after:bottom-[-0.25rem] after:left-0 after:right-0 after:h-0.5 after:rounded-sm after:bg-ink after:content-[""]',
  )
}

/** Grab handle for library drag-reorder (mirrors the track handle). */
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
        'm-0 grid h-[1.75rem] w-[1.1rem] shrink-0 place-items-center rounded-md border-0 bg-transparent p-0',
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

function songPartLabel(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? ''
  return trimmed || t('library.songPart.unnamed')
}

function toggleId(set: Set<string>, id: string): Set<string> {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

function DeleteIconButton({
  label,
  onClick,
  className,
}: {
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <Button
      variant="trash"
      className={cn(
        // Match library share / visibility action chips (songActionBtnClass).
        'relative z-[1] h-[1.65rem] w-[1.65rem] shrink-0 rounded-lg border-ink/18 p-0 text-ink/55',
        'max-sm:h-[1.65rem] max-sm:w-[1.65rem] max-sm:rounded-lg max-sm:text-[0.95rem]',
        '[&_svg]:size-[0.95rem]',
        className,
      )}
      icon={<IconTrash />}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    />
  )
}

function DuplicateIconButton({
  label,
  onClick,
  className,
}: {
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <Button
      variant="trash"
      className={cn(
        'relative z-[1] h-[1.65rem] w-[1.65rem] shrink-0 rounded-lg border-ink/18 p-0 text-ink/55',
        'max-sm:h-[1.65rem] max-sm:w-[1.65rem] max-sm:rounded-lg max-sm:text-[0.95rem]',
        '[&_svg]:size-[0.95rem]',
        className,
      )}
      icon={<IconDuplicate />}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    />
  )
}

const songActionBtnClass = cn(
  'm-0 grid h-[1.65rem] w-[1.65rem] shrink-0 place-items-center rounded-lg border border-ink/18 bg-transparent p-0',
  'text-ink/55 transition-[background,color,border-color] duration-150',
  'cursor-pointer hover:border-ink/28 hover:bg-ink/6 hover:text-ink',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-ink/18 disabled:hover:bg-transparent disabled:hover:text-ink/55',
  '[&_svg]:size-[0.95rem]',
)

function SongVisibilityButton({
  songId,
  isPublic,
  onChanged,
  onError,
}: {
  songId: string
  isPublic: boolean
  onChanged: () => void
  onError: () => void
}) {
  useLocale()
  const label = isPublic ? t('library.private') : t('library.public')
  return (
    <button
      type="button"
      className={cn(
        songActionBtnClass,
        'pointer-events-auto',
        isPublic &&
          'border-ink/40 bg-ink text-on-ink hover:border-ink hover:bg-ink hover:text-on-ink',
      )}
      aria-label={label}
      title={isPublic ? t('library.public.on') : t('library.public.off')}
      aria-pressed={isPublic}
      onClick={(event) => {
        event.stopPropagation()
        void postLibrary({
          intent: 'setSongPublic',
          songId,
          isPublic: !isPublic,
        }).then((r) => {
          if (!r.ok) onError()
          else onChanged()
        })
      }}
    >
      <IconGlobe />
    </button>
  )
}

function SongCollaborationButton({
  songId,
  allowsCollaboration,
  onChanged,
  onError,
}: {
  songId: string
  allowsCollaboration: boolean
  onChanged: () => void
  onError: () => void
}) {
  useLocale()
  const label = allowsCollaboration
    ? t('library.collaborate.disable')
    : t('library.collaborate.enable')
  return (
    <button
      type="button"
      className={cn(
        songActionBtnClass,
        'pointer-events-auto',
        allowsCollaboration &&
          'border-ink/40 bg-ink text-on-ink hover:border-ink hover:bg-ink hover:text-on-ink',
      )}
      aria-label={label}
      title={
        allowsCollaboration
          ? t('library.collaborate.on')
          : t('library.collaborate.off')
      }
      aria-pressed={allowsCollaboration}
      onClick={(event) => {
        event.stopPropagation()
        void postLibrary({
          intent: 'setSongCollaboration',
          songId,
          allowsCollaboration: !allowsCollaboration,
        }).then((r) => {
          if (!r.ok) onError()
          else onChanged()
        })
      }}
    >
      <IconCollaborate />
    </button>
  )
}

function SongShareButton({
  songPartId,
  songName,
  isPublic,
  onOpenChange,
}: {
  /** Shared URLs point at one recording session (part) of the song. */
  songPartId: string | null
  songName: string
  isPublic: boolean
  onOpenChange?: (open: boolean) => void
}) {
  useLocale()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const setShareOpen = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
  }

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setShareOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/session/${songPartId}`
      : `/session/${songPartId}`
  const shareable = isPublic && Boolean(songPartId)

  return (
    <div className="relative pointer-events-auto" ref={panelRef}>
      <button
        type="button"
        className={songActionBtnClass}
        aria-label={t('library.share')}
        title={
          shareable ? t('library.share') : t('library.share.disabled')
        }
        disabled={!shareable}
        aria-expanded={canNativeShare ? undefined : open}
        aria-haspopup={canNativeShare ? undefined : 'dialog'}
        onClick={(event) => {
          event.stopPropagation()
          if (!shareable || !songPartId) return
          if (canNativeShare) {
            void navigator
              .share({
                title: songName,
                url: shareUrl,
                text: songName,
              })
              .catch(() => {})
            return
          }
          setShareOpen(!open)
          setCopied(false)
        }}
      >
        <IconShare />
      </button>
      {!canNativeShare && open && shareable ? (
        <div
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 min-w-[11.5rem] rounded-[12px] border border-line bg-surface p-2 shadow-[0_12px_28px_var(--shadow)]"
          role="dialog"
          aria-label={t('library.share.title', { name: songName })}
        >
          <p className="m-0 mb-1.5 px-1 text-[0.72rem] font-semibold text-ink-soft">
            {t('library.share.title', { name: songName })}
          </p>
          <button
            type="button"
            className="m-0 flex w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2 py-1.5 text-left text-[0.82rem] font-semibold text-ink hover:bg-ink/6"
            onClick={() => {
              void navigator.clipboard.writeText(shareUrl).then(() => {
                setCopied(true)
              })
            }}
          >
            {copied ? t('library.share.copied') : t('library.share.copy')}
          </button>
        </div>
      ) : null}
    </div>
  )
}

const accordionControlClass = cn(
  'm-0 grid h-[2.05rem] w-[2.05rem] shrink-0 place-items-center rounded-[10px] border border-ink/12 bg-transparent p-0',
  'text-ink/55 transition-[transform,background,color,border-color] duration-160',
  'cursor-pointer hover:border-ink/22 hover:bg-ink/6 hover:text-ink',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-40',
  '[&_svg]:size-[1.15rem]',
)

function AccordionToggle({
  open,
  name,
  onToggle,
}: {
  open: boolean
  name: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={
        open
          ? t('library.collapse', { name })
          : t('library.expand', { name })
      }
      title={
        open
          ? t('library.collapse', { name })
          : t('library.expand', { name })
      }
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      className={cn(accordionControlClass, open ? 'rotate-0' : '-rotate-90')}
    >
      <IconChevron />
    </button>
  )
}

/** Compact chevron matching the song-level action buttons. */
function SongAccordionToggle({
  open,
  name,
  onToggle,
}: {
  open: boolean
  name: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={
        open ? t('library.collapse', { name }) : t('library.expand', { name })
      }
      title={
        open ? t('library.collapse', { name }) : t('library.expand', { name })
      }
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      className={cn(
        songActionBtnClass,
        'pointer-events-auto',
        open ? 'rotate-0' : '-rotate-90',
      )}
    >
      <IconChevron />
    </button>
  )
}

/** One recording session of a song — this is what the deck loads. */
function SongPartRow({
  part,
  songId,
  isActive,
  isBusy,
  drag,
  showDragHandle,
  onOpen,
  onRename,
  onDuplicate,
  onMoved,
  onMoveError,
  onDelete,
}: {
  part: LibrarySongPart
  songId: string
  isActive: boolean
  isBusy: boolean
  drag: DragRender
  showDragHandle: boolean
  onOpen: () => void
  onRename: (name: string) => void
  onDuplicate: () => void
  onMoved: (targetSongId: string) => void
  onMoveError: () => void
  onDelete: () => void
}) {
  useLocale()
  const displayName = songPartLabel(part.name)
  const [moveOpen, setMoveOpen] = useState(false)

  return (
    <li
      data-library-kind="songPart"
      data-library-id={part.id}
      data-library-parent={songId}
      className={cn(
        'relative rounded-[10px] bg-ink/[0.06] px-1.5 py-1',
        isActive && 'bg-ink/[0.1]',
        isBusy && 'opacity-60',
        moveOpen && 'z-30',
        dragRowClass(
          drag.draggingId === part.id,
          drag.dragOver?.id === part.id ? drag.dragOver.edge : null,
        ),
      )}
    >
      <button
        type="button"
        disabled={isBusy}
        aria-busy={isBusy || undefined}
        aria-label={`${t('library.open')} — ${displayName}`}
        className={cn(
          'absolute inset-0 z-0 m-0 cursor-pointer rounded-[10px] border-0 bg-transparent p-0',
          'transition-colors duration-150',
          'hover:enabled:bg-ink/[0.04]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
          'disabled:cursor-wait',
        )}
        onClick={onOpen}
      />
      <div className="relative z-[1] flex min-w-0 items-start gap-1.5 pointer-events-none">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {showDragHandle ? (
            <LibraryDragHandle
              name={displayName}
              className="pointer-events-auto h-[1.45rem]"
            />
          ) : null}
          <LibraryNameInput
            value={part.name ?? ''}
            ariaLabel={t('library.songPart')}
            placeholder={t('library.songPart.unnamed')}
            allowEmpty
            className="pointer-events-auto text-[0.9rem] font-medium text-ink"
            onCommit={onRename}
          />
        </div>
        <MoveSongPartMenu
          className="pointer-events-auto"
          songPartId={part.id}
          sourceSongId={songId}
          onOpenChange={setMoveOpen}
          onMoved={({ songId: targetSongId }) => onMoved(targetSongId)}
          onError={onMoveError}
        />
        <DuplicateIconButton
          className="pointer-events-auto"
          label={t('library.duplicateSongPart')}
          onClick={onDuplicate}
        />
        <DeleteIconButton
          className="pointer-events-auto"
          label={t('library.deleteSongPart')}
          onClick={onDelete}
        />
      </div>

      {isBusy ? (
        <div className="relative mt-1 pointer-events-none">
          <span className="text-[0.75rem] font-normal text-ink-soft">
            {t('library.opening')}
          </span>
        </div>
      ) : part.trackNames.length > 0 ? (
        <div className="relative mt-1 pointer-events-none">
          <span className="flex flex-wrap gap-1">
            {part.trackNames.map((trackName, index) => (
              <span
                key={`${trackName}-${index}`}
                className="inline-flex max-w-full truncate rounded-[7px] bg-ink/[0.06] px-[0.45rem] py-[0.18rem] text-[0.68rem] font-semibold leading-none text-ink-soft"
              >
                {trackName}
              </span>
            ))}
          </span>
        </div>
      ) : (
        <div className="relative mt-0.5 pl-[0.25rem] pointer-events-none">
          <span className="block text-[0.75rem] font-normal leading-none text-ink-soft">
            {tp(
              'library.count.track.one',
              'library.count.track.other',
              0,
            )}
          </span>
        </div>
      )}
    </li>
  )
}

/** Musical work (œuvre): holds visibility / sharing and a list of sessions. */
function SongCard({
  song,
  repertoireId,
  open,
  activeSongPartId,
  busyPartId,
  drag,
  showDragHandle,
  onToggle,
  onOpenPart,
  onRenameSong,
  onRenamePart,
  onDeleteSong,
  onDuplicatePart,
  onMovedPart,
  onDeletePart,
  onCreatePart,
  onVisibilityError,
  onVisibilityChanged,
  onError,
}: {
  song: LibrarySong
  repertoireId: string
  open: boolean
  activeSongPartId: string | null
  busyPartId: string | null
  drag: DragRender
  showDragHandle: boolean
  onToggle: () => void
  onOpenPart: (partId: string) => void
  onRenameSong: (name: string) => void
  onRenamePart: (partId: string, name: string) => void
  onDeleteSong: () => void
  onDuplicatePart: (part: LibrarySongPart) => void
  onMovedPart: (part: LibrarySongPart, targetSongId: string) => void
  onDeletePart: (part: LibrarySongPart) => void
  onCreatePart: () => void
  onVisibilityError: () => void
  onVisibilityChanged: () => void
  onError: () => void
}) {
  useLocale()
  const [shareOpen, setShareOpen] = useState(false)
  const hasActivePart = song.parts.some((part) => part.id === activeSongPartId)
  const showPartDragHandle = song.parts.length > 1

  return (
    <li
      data-library-kind="song"
      data-library-id={song.id}
      data-library-parent={repertoireId}
      className={cn(
        'relative rounded-[10px] bg-ink/[0.045] px-1.5 py-1.5',
        hasActivePart && 'bg-ink/[0.08]',
        shareOpen && 'z-30',
        dragRowClass(
          drag.draggingId === song.id,
          drag.dragOver?.id === song.id ? drag.dragOver.edge : null,
        ),
      )}
    >
      <div className="relative flex min-w-0 items-center gap-1.5">
        {showDragHandle ? <LibraryDragHandle name={song.name} /> : null}
        <SongAccordionToggle
          open={open}
          name={song.name}
          onToggle={onToggle}
        />
        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            aria-expanded={open}
            aria-label={
              open
                ? t('library.collapse', { name: song.name })
                : t('library.expand', { name: song.name })
            }
            className={cn(
              'absolute inset-0 z-0 m-0 cursor-pointer rounded-[8px] border-0 bg-transparent p-0',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
            )}
            onClick={onToggle}
          />
          <div className="relative z-[1] pointer-events-none">
            <p className="m-0 text-[0.62rem] font-bold uppercase tracking-[0.07em] text-ink-soft">
              <span>{t('library.song')}</span>
              <span className="ml-2 font-medium normal-case tracking-normal text-ink/35">
                {tp(
                  'library.count.songPart.one',
                  'library.count.songPart.other',
                  song.parts.length,
                )}
              </span>
            </p>
            <LibraryNameInput
              value={song.name}
              ariaLabel={t('library.song')}
              className="pointer-events-auto mt-0.5 text-[0.95rem] font-semibold text-ink"
              onCommit={onRenameSong}
            />
          </div>
        </div>
        <div
          className={cn(
            'relative flex shrink-0 items-center gap-1.5',
            shareOpen ? 'z-20' : 'z-[1]',
          )}
        >
          <SongVisibilityButton
            songId={song.id}
            isPublic={song.isPublic}
            onError={onVisibilityError}
            onChanged={onVisibilityChanged}
          />
          {song.isPublic ? (
            <SongCollaborationButton
              songId={song.id}
              allowsCollaboration={song.allowsCollaboration}
              onError={onVisibilityError}
              onChanged={onVisibilityChanged}
            />
          ) : null}
          <SongShareButton
            songPartId={shareTargetPartId(song, activeSongPartId)}
            songName={song.name}
            isPublic={song.isPublic}
            onOpenChange={setShareOpen}
          />
          <DeleteIconButton
            label={t('library.delete')}
            onClick={onDeleteSong}
          />
        </div>
      </div>

      {open ? (
        <ul
          className={cn(
            'm-0 mt-2 flex list-none flex-col gap-2 p-0',
            showDragHandle
              ? 'pl-[calc(1.1rem+1.65rem+0.75rem)]'
              : 'pl-[calc(1.65rem+0.75rem)]',
          )}
        >
          {song.parts.map((part) => (
            <SongPartRow
              key={part.id}
              part={part}
              songId={song.id}
              isActive={part.id === activeSongPartId}
              isBusy={busyPartId === part.id}
              drag={drag}
              showDragHandle={showPartDragHandle}
              onOpen={() => onOpenPart(part.id)}
              onRename={(name) => onRenamePart(part.id, name)}
              onDuplicate={() => onDuplicatePart(part)}
              onMoved={(targetSongId) => onMovedPart(part, targetSongId)}
              onMoveError={onError}
              onDelete={() => onDeletePart(part)}
            />
          ))}
          <AddLeafRow
            defaultLabel={t('library.addSongPart')}
            allowEmptyDefault
            alignWithRowFrame
            create={(name) =>
              postLibrary({
                intent: 'createSongPart',
                songId: song.id,
                name,
                alignPrefs: readAlignPrefs(),
              })
            }
            onCreated={onCreatePart}
            onError={onError}
          />
        </ul>
      ) : null}
    </li>
  )
}

function AddNodeRow({
  defaultLabel,
  levelLabel,
  levelLabelClassName,
  inputClassName,
  create,
  onCreated,
  onError,
  className,
  dragGutter = true,
}: {
  defaultLabel: string
  levelLabel: string
  levelLabelClassName?: string
  inputClassName?: string
  create: (
    name: string,
  ) => Promise<{ ok: boolean; reason?: string; id?: string }>
  onCreated: (id: string) => void
  onError: () => void
  className?: string
  dragGutter?: boolean
}) {
  useLocale()
  const [draft, setDraft] = useState(defaultLabel)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isDefault = draft.trim() === defaultLabel

  useEffect(() => {
    setDraft(defaultLabel)
  }, [defaultLabel])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [draft])

  const focusAndSelect = () => {
    const el = inputRef.current
    if (!el || busy) return
    el.focus()
    el.select()
  }

  const commit = () => {
    const name = draft.trim()
    if (!name || name === defaultLabel || busy) {
      setDraft(defaultLabel)
      return
    }
    setBusy(true)
    void create(name)
      .then((r) => {
        if (!r.ok || !r.id) {
          onError()
          setDraft(defaultLabel)
          return
        }
        setDraft(defaultLabel)
        onCreated(r.id)
      })
      .finally(() => {
        setBusy(false)
      })
  }

  return (
    <li className={className}>
      <div className="flex items-start gap-1.5">
        {dragGutter ? (
          <span className="w-[1.1rem] shrink-0" aria-hidden="true" />
        ) : null}
        <button
          type="button"
          aria-label={defaultLabel}
          title={defaultLabel}
          disabled={busy}
          onClick={focusAndSelect}
          className={cn(
            accordionControlClass,
            'mt-[1.15rem] text-[1.25rem] font-medium leading-none',
          )}
        >
          <span aria-hidden="true">+</span>
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'm-0 text-[0.62rem] font-bold uppercase tracking-[0.07em] text-ink-soft',
              levelLabelClassName,
            )}
          >
            {levelLabel}
          </p>
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            disabled={busy}
            aria-label={defaultLabel}
            maxLength={LIBRARY_TITLE_MAX_LEN}
            spellCheck={false}
            className={cn(
              'm-0 mt-0.5 w-full max-w-full min-w-[5.5ch] resize-none overflow-hidden break-words rounded-[8px] border-0 bg-transparent py-[0.1rem] pl-0 pr-9 font-[inherit] leading-[1.25] field-sizing-content',
              'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none',
              'focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
              'disabled:opacity-55',
              isDefault
                ? 'italic font-medium text-ink/45 [font-synthesis:style]'
                : 'text-ink',
              inputClassName,
            )}
            onChange={(event) =>
              setDraft(event.target.value.replace(/\n/g, ' '))
            }
            onFocus={(event) => {
              if (event.currentTarget.value.trim() !== defaultLabel) return
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
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
              }
              if (event.key === 'Escape') {
                setDraft(defaultLabel)
                event.currentTarget.blur()
              }
            }}
            onBlur={commit}
          />
        </div>
      </div>
    </li>
  )
}

function AddRepertoireRow({
  groupId,
  onCreated,
  onError,
  dragGutter = true,
}: {
  groupId: string
  onCreated: (id: string) => void
  onError: () => void
  dragGutter?: boolean
}) {
  useLocale()
  return (
    <AddNodeRow
      defaultLabel={t('library.addRepertoire')}
      levelLabel={t('library.repertoire')}
      inputClassName="text-[1.02rem] font-semibold tracking-[-0.01em]"
      dragGutter={dragGutter}
      create={(name) =>
        postLibrary({
          intent: 'createRepertoire',
          groupId,
          name,
        })
      }
      onCreated={onCreated}
      onError={onError}
    />
  )
}

function AddGroupRow({
  onCreated,
  onError,
  className,
  dragGutter = true,
}: {
  onCreated: (id: string) => void
  onError: () => void
  className?: string
  dragGutter?: boolean
}) {
  useLocale()
  return (
    <AddNodeRow
      className={className}
      defaultLabel={t('library.addGroup')}
      levelLabel={t('library.group')}
      levelLabelClassName="text-[0.7rem] font-extrabold tracking-[0.09em] text-ink/55"
      inputClassName="font-display text-[1.28rem] font-bold tracking-[-0.02em]"
      dragGutter={dragGutter}
      create={(name) => postLibrary({ intent: 'createGroup', name })}
      onCreated={onCreated}
      onError={onError}
    />
  )
}

/** Leaf-level "+ name" row (songs and song parts). */
function AddLeafRow({
  defaultLabel,
  create,
  onCreated,
  onError,
  allowEmptyDefault = false,
  alignWithRowFrame = false,
  dragGutter = true,
}: {
  defaultLabel: string
  create: (
    name: string,
  ) => Promise<{ ok: boolean; reason?: string; id?: string }>
  onCreated: (id: string) => void
  onError: () => void
  /** When true, confirming the default label creates an unnamed item. */
  allowEmptyDefault?: boolean
  /** Flush the + control with the left edge of sibling row frames. */
  alignWithRowFrame?: boolean
  /** Spacer matching sibling drag handles (off when those handles are hidden). */
  dragGutter?: boolean
}) {
  useLocale()
  const [draft, setDraft] = useState(defaultLabel)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isDefault = draft.trim() === defaultLabel

  useEffect(() => {
    setDraft(defaultLabel)
  }, [defaultLabel])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [draft])

  const focusAndSelect = () => {
    const el = inputRef.current
    if (!el || busy) return
    el.focus()
    el.select()
  }

  const commit = () => {
    if (busy) return
    const name = draft.trim()
    const isEmptyOrDefault = !name || name === defaultLabel
    if (isEmptyOrDefault && !allowEmptyDefault) {
      setDraft(defaultLabel)
      return
    }
    const finalName = isEmptyOrDefault ? '' : name
    setBusy(true)
    void create(finalName)
      .then((r) => {
        if (!r.ok) {
          onError()
          setDraft(defaultLabel)
          return
        }
        setDraft(defaultLabel)
        onCreated(r.id ?? '')
      })
      .finally(() => {
        setBusy(false)
      })
  }

  const showDragGutter = dragGutter && !alignWithRowFrame

  return (
    <li
      className={cn(
        'rounded-[10px] py-1',
        alignWithRowFrame ? 'pr-1.5' : 'px-1.5',
      )}
    >
      <div className="flex min-w-0 items-start gap-1.5">
        {showDragGutter ? (
          <span className="w-[1.1rem] shrink-0" aria-hidden="true" />
        ) : null}
        <button
          type="button"
          aria-label={defaultLabel}
          title={defaultLabel}
          disabled={busy}
          onClick={focusAndSelect}
          className={cn(
            'm-0 grid h-[1.55rem] w-[1.55rem] shrink-0 place-items-center rounded-lg border border-ink/12 bg-transparent p-0',
            'text-[1.1rem] font-medium leading-none text-ink/45',
            'transition-[background,color,border-color] duration-150',
            'cursor-pointer hover:border-ink/22 hover:bg-ink/6 hover:text-ink',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <span aria-hidden="true">+</span>
        </button>
        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          disabled={busy}
          aria-label={defaultLabel}
          maxLength={LIBRARY_TITLE_MAX_LEN}
          spellCheck={false}
          className={cn(
            'm-0 w-full max-w-full min-w-[5.5ch] resize-none overflow-hidden break-words rounded-[8px] border-0 bg-transparent py-[0.1rem] pl-[0.15rem] pr-9 font-[inherit] leading-[1.25] field-sizing-content',
            'text-[0.9rem]',
            'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none',
            'focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
            'disabled:opacity-55',
            isDefault
              ? 'italic font-medium text-ink/45 [font-synthesis:style]'
              : 'font-medium text-ink',
          )}
          onChange={(event) =>
            setDraft(event.target.value.replace(/\n/g, ' '))
          }
          onFocus={(event) => {
            if (event.currentTarget.value.trim() !== defaultLabel) return
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
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
            if (event.key === 'Escape') {
              setDraft(defaultLabel)
              event.currentTarget.blur()
            }
          }}
          onBlur={commit}
        />
      </div>
    </li>
  )
}

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
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [draft])

  const showPlaceholderStyle = allowEmpty && !draft.trim() && Boolean(placeholder)

  return (
    <textarea
      ref={ref}
      rows={1}
      value={draft}
      placeholder={placeholder}
      aria-label={ariaLabel}
      maxLength={LIBRARY_TITLE_MAX_LEN}
      spellCheck={false}
      className={cn(
        'relative z-[1] m-0 w-full max-w-full min-w-[5.5ch] resize-none overflow-hidden break-words rounded-[8px] border-0 bg-transparent py-[0.1rem] pl-[0.25rem] pr-9 font-[inherit] text-inherit leading-[1.25] field-sizing-content',
        'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none',
        'focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
        className,
        showPlaceholderStyle &&
          'italic text-ink-soft [font-synthesis:style] placeholder:italic placeholder:text-ink-soft',
      )}
      onChange={(event) =>
        setDraft(event.target.value.replace(/\n/g, ' '))
      }
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

export function LibraryPanel({ className }: LibraryPanelProps) {
  useLocale()
  const navigate = useNavigate()
  const rootData = useRouteLoaderData<typeof rootLoader>('root')
  const user = rootData?.user ?? null
  const activeSongPartId = useSessionStore((s) => s.activeSongPartId)
  const deckSongId = useSessionStore((s) => s.deckSongId)
  const patch = useSessionStore((s) => s.patch)
  const error = useSessionStore((s) => s.error)
  const setError = useSessionStore((s) => s.setError)

  const [tree, setTree] = useState<LibraryTree | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyPartId, setBusyPartId] = useState<string | null>(null)
  const [openGroupIds, setOpenGroupIds] = useState<Set<string>>(() => new Set())
  const [openRepIds, setOpenRepIds] = useState<Set<string>>(() => new Set())
  const [openSongIds, setOpenSongIds] = useState<Set<string>>(() => new Set())
  const [accordionSeeded, setAccordionSeeded] = useState(false)
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null)
  const [dragOver, setDragOver] = useState<DragOver>(null)
  const treeRef = useRef(tree)
  treeRef.current = tree
  const treeListRef = useRef<HTMLUListElement>(null)
  const dragInfoRef = useRef<DragInfo | null>(null)
  const touchDragRef = useRef<{
    pointerId: number
    info: DragInfo
    startY: number
    active: boolean
  } | null>(null)

  const reload = useCallback(async () => {
    const quiet = treeRef.current !== null
    if (!quiet) setLoading(true)
    try {
      const res = await fetch('/api/cloud/library')
      const data = (await res.json()) as
        | { ok: true; tree: LibraryTree }
        | { ok: false; reason: string }
      if (!data.ok) {
        setError(
          data.reason === 'unauthorized'
            ? t('cloud.error.unauthorized')
            : t('library.error'),
        )
        setTree(null)
        return
      }
      setTree(data.tree)
    } catch {
      setError(t('library.error'))
      setTree(null)
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [setError])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    void reload()
  }, [user, reload])

  useEffect(() => {
    if (!tree) return
    const path = findActivePath(tree, activeSongPartId)
    if (path) {
      setOpenGroupIds((prev) => new Set(prev).add(path.groupId))
      setOpenRepIds((prev) => new Set(prev).add(path.repertoireId))
      setOpenSongIds((prev) => new Set(prev).add(path.songId))
      setAccordionSeeded(true)
      return
    }
    if (accordionSeeded) return
    const firstGroup = tree.groups[0]
    if (!firstGroup) return
    setOpenGroupIds(new Set([firstGroup.id]))
    const firstRep = firstGroup.repertoires[0]
    if (firstRep) setOpenRepIds(new Set([firstRep.id]))
    setAccordionSeeded(true)
  }, [tree, activeSongPartId, accordionSeeded])

  const applyLocalRename = useCallback(
    (kind: NodeKind, id: string, name: string) => {
      setTree((prev) => {
        if (!prev) return prev
        return {
          groups: prev.groups.map((group) => {
            if (kind === 'group' && group.id === id) {
              return { ...group, name }
            }
            return {
              ...group,
              repertoires: group.repertoires.map((rep) => {
                if (kind === 'repertoire' && rep.id === id) {
                  return { ...rep, name }
                }
                return {
                  ...rep,
                  songs: rep.songs.map((song) => {
                    if (kind === 'song' && song.id === id) {
                      return { ...song, name }
                    }
                    if (kind !== 'songPart') return song
                    return {
                      ...song,
                      parts: song.parts.map((part) =>
                        part.id === id ? { ...part, name } : part,
                      ),
                    }
                  }),
                }
              }),
            }
          }),
        }
      })
      syncDeckLabelsAfterLibraryRename(kind, id, name)
    },
    [],
  )

  const renameNode = useCallback(
    (kind: NodeKind, id: string, name: string) => {
      applyLocalRename(kind, id, name)
      void postLibrary({ intent: 'rename', kind, id, name }).then((r) => {
        if (!r.ok) {
          setError(t('library.error'))
          void reload()
        }
      })
    },
    [applyLocalRename, reload, setError],
  )

  const clearDragState = useCallback(() => {
    dragInfoRef.current = null
    touchDragRef.current = null
    setDragInfo(null)
    setDragOver(null)
  }, [])

  const updateDragOverFromPoint = useCallback((clientY: number) => {
    const info = dragInfoRef.current
    const root = treeListRef.current
    if (!info || !root) return
    setDragOver(dropTargetFromPoint(root, info, clientY))
  }, [])

  const commitDragFromPoint = useCallback(
    (clientY: number) => {
      const info = dragInfoRef.current
      const root = treeListRef.current
      const current = treeRef.current
      const target =
        info && root ? dropTargetFromPoint(root, info, clientY) : null
      clearDragState()
      if (!info || !current || !target) return

      const ids = siblingIds(current, info.kind, info.parentId)
      const targetIndex = ids.indexOf(target.id)
      if (targetIndex < 0) return
      const beforeId =
        target.edge === 'before'
          ? target.id
          : (ids[targetIndex + 1] ?? null)
      if (beforeId === info.id) return
      const ordered = moveBefore(ids, info.id, beforeId)
      if (!ordered) return

      const next = applyLocalReorder(current, info.kind, info.parentId, ordered)
      setTree(next)
      // Keep the deck's prev / next order in sync with the library.
      if (info.kind === 'songPart' && info.parentId === deckSongId) {
        const song = next.groups
          .flatMap((group) => group.repertoires)
          .flatMap((rep) => rep.songs)
          .find((candidate) => candidate.id === deckSongId)
        if (song) {
          patch({
            deckSongPartSiblings: song.parts.map((part) => ({
              id: part.id,
              name: part.name,
            })),
          })
        }
      }
      void postLibrary({
        intent: 'reorder',
        kind: info.kind,
        id: info.id,
        beforeId,
      }).then((r) => {
        if (!r.ok) {
          setError(t('library.error'))
          void reload()
        }
      })
    },
    [clearDragState, deckSongId, patch, reload, setError],
  )

  /** Wipe the deck when the active cloud session is deleted from the library. */
  const forgetActivePartIfIn = (parts: Array<{ id: string }>) => {
    const { activeSongPartId: activeId, deckSongPartId } =
      useSessionStore.getState()
    const hit =
      (activeId != null && parts.some((part) => part.id === activeId)) ||
      (deckSongPartId != null &&
        parts.some((part) => part.id === deckSongPartId))
    if (!hit) return
    clearLocalDeckSession()
  }

  const onOpenSongPart = async (songPartId: string) => {
    setBusyPartId(songPartId)
    setError(null)
    try {
      const ok = await loadCloudSongIntoSession(songPartId, { force: true })
      if (ok) navigate(librarySessionPath(songPartId))
    } finally {
      setBusyPartId(null)
    }
  }

  if (!user) {
    return (
      <DeckOverlayPanel
        title={t('library.title')}
        className={className}
        closeAriaLabel={t('library.close')}
      >
        <p className="m-0 text-[0.92rem] text-ink-soft">
          {t('cloud.error.unauthorized')}
        </p>
      </DeckOverlayPanel>
    )
  }

  return (
    <DeckOverlayPanel
      title={t('library.title')}
      className={className}
      bodyClassName="flex flex-col gap-4"
      closeAriaLabel={t('library.close')}
    >
      {error ? (
        <ErrorBanner className="mt-0" onDismiss={() => setError(null)}>
          {error}
        </ErrorBanner>
      ) : null}
      {loading ? (
        <p className="m-0 text-[0.9rem] text-ink-soft">{t('library.opening')}</p>
      ) : !tree ? (
        <p className="m-0 text-[0.9rem] text-ink-soft">{t('library.empty')}</p>
      ) : (
        <ul
          className="m-0 flex list-none flex-col p-0"
          ref={treeListRef}
          onDragStart={(event) => {
            const target = event.target
            if (!(target instanceof Element)) return
            const handle = target.closest<HTMLElement>('[data-library-drag]')
            if (!handle || !event.dataTransfer) return
            const info = dragInfoFromHandle(handle)
            if (!info) return
            touchDragRef.current = null
            dragInfoRef.current = info
            setDragInfo(info)
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', info.id)
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
            if (event.pointerType === 'mouse') return
            if (!(event.target instanceof Element)) return
            const handle =
              event.target.closest<HTMLElement>('[data-library-drag]')
            if (!handle) return
            const info = dragInfoFromHandle(handle)
            if (!info) return
            touchDragRef.current = {
              pointerId: event.pointerId,
              info,
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
          {tree.groups.map((group) => {
            const groupOpen = openGroupIds.has(group.id)
            return (
              <li
                key={group.id}
                data-library-kind="group"
                data-library-id={group.id}
                data-library-parent={ROOT_PARENT_ID}
                className={cn(
                  'relative mb-5 border-b border-line/60 pb-5',
                  dragRowClass(
                    dragInfo?.id === group.id,
                    dragOver?.id === group.id ? dragOver.edge : null,
                  ),
                )}
              >
                <div
                  className="flex cursor-pointer items-center gap-1.5"
                  onClick={() =>
                    setOpenGroupIds((prev) => toggleId(prev, group.id))
                  }
                >
                  {tree.groups.length > 1 ? (
                    <LibraryDragHandle name={group.name} />
                  ) : null}
                  <AccordionToggle
                    open={groupOpen}
                    name={group.name}
                    onToggle={() =>
                      setOpenGroupIds((prev) => toggleId(prev, group.id))
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[0.7rem] font-extrabold uppercase tracking-[0.09em] text-ink/55">
                      <span>{t('library.group')}</span>
                      <span className="font-semibold normal-case tracking-normal text-ink/40">
                        {t('library.group.meta', {
                          repertoires: tp(
                            'library.count.repertoire.one',
                            'library.count.repertoire.other',
                            group.repertoires.length,
                          ),
                          songs: tp(
                            'library.count.song.one',
                            'library.count.song.other',
                            group.repertoires.reduce(
                              (sum, rep) => sum + rep.songs.length,
                              0,
                            ),
                          ),
                        })}
                      </span>
                    </p>
                    <LibraryNameInput
                      value={group.name}
                      ariaLabel={t('library.group')}
                      className="font-display mt-0.5 pl-0 text-[1.28rem] font-bold tracking-[-0.02em] text-ink"
                      onCommit={(name) =>
                        renameNode('group', group.id, name)
                      }
                    />
                  </div>
                  <DeleteIconButton
                    className="mr-1.5"
                    label={t('library.delete')}
                    onClick={() => {
                      if (
                        !window.confirm(
                          t('library.deleteConfirm', { name: group.name }),
                        )
                      ) {
                        return
                      }
                      void postLibrary({
                        intent: 'delete',
                        kind: 'group',
                        id: group.id,
                      }).then((r) => {
                        if (!r.ok) setError(t('library.error'))
                        else void reload()
                      })
                    }}
                  />
                </div>

                {groupOpen ? (
                  <ul
                    className={cn(
                      'm-0 mt-3.5 flex list-none flex-col gap-4 border-l-[2.5px] border-ink/18 p-0 pl-3.5',
                      tree.groups.length > 1 ? 'ml-[2.1rem]' : 'ml-[1rem]',
                    )}
                  >
                    {group.repertoires.map((rep) => {
                      const repOpen = openRepIds.has(rep.id)
                      return (
                        <li
                          key={rep.id}
                          data-library-kind="repertoire"
                          data-library-id={rep.id}
                          data-library-parent={group.id}
                          className={cn(
                            'relative',
                            dragRowClass(
                              dragInfo?.id === rep.id,
                              dragOver?.id === rep.id ? dragOver.edge : null,
                            ),
                          )}
                        >
                          <div
                            className="flex cursor-pointer items-center gap-1.5"
                            onClick={() =>
                              setOpenRepIds((prev) => toggleId(prev, rep.id))
                            }
                          >
                            {group.repertoires.length > 1 ? (
                              <LibraryDragHandle name={rep.name} />
                            ) : null}
                            <AccordionToggle
                              open={repOpen}
                              name={rep.name}
                              onToggle={() =>
                                setOpenRepIds((prev) =>
                                  toggleId(prev, rep.id),
                                )
                              }
                            />
                            <div className="min-w-0 flex-1">
                              <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[0.62rem] font-bold uppercase tracking-[0.07em] text-ink-soft">
                                <span>{t('library.repertoire')}</span>
                                <span className="font-medium normal-case tracking-normal text-ink/35">
                                  {tp(
                                    'library.count.song.one',
                                    'library.count.song.other',
                                    rep.songs.length,
                                  )}
                                </span>
                              </p>
                              <LibraryNameInput
                                value={rep.name}
                                ariaLabel={t('library.repertoire')}
                                className="mt-0.5 pl-0 text-[1.02rem] font-semibold tracking-[-0.01em] text-ink"
                                onCommit={(name) =>
                                  renameNode('repertoire', rep.id, name)
                                }
                              />
                            </div>
                            <DeleteIconButton
                              className="mr-1.5"
                              label={t('library.delete')}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    t('library.deleteConfirm', {
                                      name: rep.name,
                                    }),
                                  )
                                ) {
                                  return
                                }
                                void postLibrary({
                                  intent: 'delete',
                                  kind: 'repertoire',
                                  id: rep.id,
                                }).then((r) => {
                                  if (!r.ok) setError(t('library.error'))
                                  else void reload()
                                })
                              }}
                            />
                          </div>

                          {repOpen ? (
                            <ul
                              className={cn(
                                'm-0 mt-2.5 flex list-none flex-col gap-2.5 p-0',
                                group.repertoires.length > 1
                                  ? 'pl-[calc(1.1rem+2.05rem+0.75rem)]'
                                  : 'pl-[calc(2.05rem+0.75rem)]',
                              )}
                            >
                              {rep.songs.map((song) => (
                                <SongCard
                                  key={song.id}
                                  song={song}
                                  repertoireId={rep.id}
                                  open={openSongIds.has(song.id)}
                                  activeSongPartId={activeSongPartId}
                                  busyPartId={busyPartId}
                                  drag={{
                                    draggingId: dragInfo?.id ?? null,
                                    dragOver,
                                  }}
                                  showDragHandle={rep.songs.length > 1}
                                  onToggle={() =>
                                    setOpenSongIds((prev) =>
                                      toggleId(prev, song.id),
                                    )
                                  }
                                  onOpenPart={(partId) =>
                                    void onOpenSongPart(partId)
                                  }
                                  onRenameSong={(name) =>
                                    renameNode('song', song.id, name)
                                  }
                                  onRenamePart={(partId, name) =>
                                    renameNode('songPart', partId, name)
                                  }
                                  onDeleteSong={() => {
                                    if (
                                      !window.confirm(
                                        t('library.deleteConfirm', {
                                          name: song.name,
                                        }),
                                      )
                                    ) {
                                      return
                                    }
                                    void postLibrary({
                                      intent: 'delete',
                                      kind: 'song',
                                      id: song.id,
                                    }).then((r) => {
                                      if (!r.ok) {
                                        setError(t('library.error'))
                                        return
                                      }
                                      forgetActivePartIfIn(song.parts)
                                      void reload()
                                    })
                                  }}
                                  onDuplicatePart={(part) => {
                                    const suggested =
                                      part.name?.trim() ||
                                      t('library.songPart.unnamed')
                                    const name = window.prompt(
                                      t('library.duplicateSongPartPrompt'),
                                      suggested,
                                    )
                                    if (name == null) return
                                    void postLibrary({
                                      intent: 'duplicateSongPart',
                                      id: part.id,
                                      name: name.trim(),
                                    }).then((r) => {
                                      if (!r.ok) {
                                        setError(t('library.error'))
                                        return
                                      }
                                      setOpenSongIds((prev) =>
                                        new Set(prev).add(song.id),
                                      )
                                      void reload()
                                    })
                                  }}
                                  onMovedPart={(_part, targetSongId) => {
                                    void reload().then(() => {
                                      const path = treeRef.current
                                        ? findSongPath(
                                            treeRef.current,
                                            targetSongId,
                                          )
                                        : null
                                      if (!path) return
                                      setOpenGroupIds((prev) =>
                                        new Set(prev).add(path.groupId),
                                      )
                                      setOpenRepIds((prev) =>
                                        new Set(prev).add(path.repertoireId),
                                      )
                                      setOpenSongIds((prev) =>
                                        new Set(prev).add(path.songId),
                                      )
                                    })
                                  }}
                                  onDeletePart={(part) => {
                                    if (
                                      !window.confirm(
                                        t('library.deleteSongPartConfirm', {
                                          name: songPartLabel(part.name),
                                        }),
                                      )
                                    ) {
                                      return
                                    }
                                    void postLibrary({
                                      intent: 'delete',
                                      kind: 'songPart',
                                      id: part.id,
                                    }).then((r) => {
                                      if (!r.ok) {
                                        setError(t('library.error'))
                                        return
                                      }
                                      forgetActivePartIfIn([part])
                                      void reload()
                                    })
                                  }}
                                  onCreatePart={() => {
                                    setOpenSongIds((prev) =>
                                      new Set(prev).add(song.id),
                                    )
                                    void reload()
                                  }}
                                  onError={() => setError(t('library.error'))}
                                  onVisibilityError={() =>
                                    setError(t('library.error'))
                                  }
                                  onVisibilityChanged={() => {
                                    void reload()
                                    void refreshOpenDeckForSong(song.id)
                                  }}
                                />
                              ))}
                              <AddLeafRow
                                defaultLabel={t('library.addSong')}
                                dragGutter={rep.songs.length > 1}
                                create={(name) =>
                                  postLibrary({
                                    intent: 'createSong',
                                    repertoireId: rep.id,
                                    name,
                                    alignPrefs: readAlignPrefs(),
                                  })
                                }
                                onError={() => setError(t('library.error'))}
                                onCreated={(id) => {
                                  setOpenRepIds((prev) =>
                                    new Set(prev).add(rep.id),
                                  )
                                  if (id) {
                                    setOpenSongIds((prev) =>
                                      new Set(prev).add(id),
                                    )
                                  }
                                  void reload()
                                }}
                              />
                            </ul>
                          ) : null}
                        </li>
                      )
                    })}
                    <AddRepertoireRow
                      groupId={group.id}
                      dragGutter={group.repertoires.length > 1}
                      onError={() => setError(t('library.error'))}
                      onCreated={(id) => {
                        setOpenGroupIds((prev) => new Set(prev).add(group.id))
                        setOpenRepIds((prev) => new Set(prev).add(id))
                        void reload()
                      }}
                    />
                  </ul>
                ) : null}
              </li>
            )
          })}
          <AddGroupRow
            dragGutter={tree.groups.length > 1}
            onError={() => setError(t('library.error'))}
            onCreated={(id) => {
              setOpenGroupIds((prev) => new Set(prev).add(id))
              void reload()
            }}
          />
        </ul>
      )}
    </DeckOverlayPanel>
  )
}
