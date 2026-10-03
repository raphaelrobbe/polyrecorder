import { useEffect, useRef, useState } from 'react'
import { useLocale } from '../../hooks/useLocale'
import { readAlignPrefs } from '../../lib/alignPrefs'
import { t, tp } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { IconCollaborate, IconChevron, IconGlobe, IconShare } from '../icons'
import { AddLeafRow } from './LibraryAddRows'
import {
  DeleteIconButton,
  LibraryDragHandle,
  LibraryNameInput,
} from './LibraryRowActions'
import { SongPartRow } from './LibrarySongPartRow'
import {
  dragRowClass,
  postLibrary,
  shareTargetPartId,
  type DragRender,
  type LibrarySong,
  type LibrarySongPart,
} from './libraryPanelHelpers'

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

export type LibrarySongCardProps = {
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
}

/** Musical work (œuvre): holds visibility / sharing and a list of sessions. */
export function SongCard({
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
}: LibrarySongCardProps) {
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
