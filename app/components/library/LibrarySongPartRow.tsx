import { useState } from 'react'
import { useLocale } from '../../hooks/useLocale'
import { t, tp } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { MoveSongPartMenu } from './MoveSongPartMenu'
import {
  DeleteIconButton,
  DuplicateIconButton,
  LibraryDragHandle,
  LibraryNameInput,
} from './LibraryRowActions'
import {
  dragRowClass,
  songPartLabel,
  type DragRender,
  type LibrarySongPart,
} from './libraryPanelHelpers'

export type LibrarySongPartRowProps = {
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
}

/** One recording session of a song — this is what the deck loads. */
export function SongPartRow({
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
}: LibrarySongPartRowProps) {
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
