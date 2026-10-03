import { useId, useRef, useState } from 'react'
import { useLocale } from '../../hooks/useLocale'
import { t } from '../../lib/i18n'
import {
  fetchLibraryTree,
  postLibrary,
} from '../../lib/libraryApi.client'
import type { LibraryTree } from '../../lib/libraryTree'
import { loadCloudSongIntoSession } from '../../lib/sessionActions.client'
import { useSessionStore } from '../../store/sessionStore'
import { cn } from '../../lib/utils'
import { IconMove } from '../icons'
import { LibraryDestinationMenu } from './LibraryDestinationMenu'

type MoveSongPartMenuProps = {
  songPartId: string
  sourceSongId: string
  className?: string
  /** Elevate a parent row while the menu is open (overflow / stacking). */
  onOpenChange?: (open: boolean) => void
  onMoved?: (result: { songId: string }) => void
  onError?: () => void
}

export function MoveSongPartMenu({
  songPartId,
  sourceSongId,
  className,
  onOpenChange,
  onMoved,
  onError,
}: MoveSongPartMenuProps) {
  useLocale()
  const [open, setOpen] = useState(false)
  const [tree, setTree] = useState<LibraryTree | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  const setMenuOpen = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
    if (!next) {
      setBusy(false)
    }
  }

  const loadTree = async () => {
    setLoading(true)
    const next = await fetchLibraryTree()
    setTree(next)
    setLoading(false)
    if (!next) onError?.()
  }

  const openMenu = () => {
    setTree(null)
    setMenuOpen(true)
    void loadTree()
  }

  const finishMove = async (targetSongId: string) => {
    const result = await postLibrary({
      intent: 'moveSongPart',
      id: songPartId,
      targetSongId,
    })
    if (!result.ok || !result.id) {
      onError?.()
      return
    }
    const { deckSongPartId, activeSongPartId } = useSessionStore.getState()
    if (deckSongPartId === songPartId || activeSongPartId === songPartId) {
      void loadCloudSongIntoSession(songPartId, { force: true, quiet: true })
    }
    setMenuOpen(false)
    onMoved?.({ songId: targetSongId })
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          'm-0 grid h-[1.65rem] w-[1.65rem] shrink-0 place-items-center rounded-lg border border-ink/18 bg-transparent p-0',
          'text-ink/55 transition-[background,color,border-color] duration-150',
          'cursor-pointer hover:border-ink/28 hover:bg-ink/6 hover:text-ink',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-35',
          open && 'border-ink/28 bg-ink/6 text-ink',
          '[&_svg]:size-[0.95rem]',
        )}
        aria-label={t('library.moveSongPart')}
        title={t('library.moveSongPart')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={busy}
        onClick={(event) => {
          event.stopPropagation()
          if (open) setMenuOpen(false)
          else openMenu()
        }}
      >
        <IconMove />
      </button>
      {open ? (
        <LibraryDestinationMenu
          open={open}
          tree={tree}
          loading={loading}
          dismissRef={rootRef}
          menuId={menuId}
          ariaLabel={t('library.moveSongPart')}
          terminalLevel="song"
          excludeSongId={sourceSongId}
          placement="portal"
          anchorRef={buttonRef}
          onClose={() => setMenuOpen(false)}
          onReloadTree={loadTree}
          onError={() => onError?.()}
          onSongChosen={finishMove}
          onBusyChange={setBusy}
        />
      ) : null}
    </div>
  )
}
