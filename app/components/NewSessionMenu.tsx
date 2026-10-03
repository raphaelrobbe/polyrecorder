import { useId, useRef, useState } from 'react'
import { useNavigate } from '@remix-run/react'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { fetchLibraryTree } from '../lib/libraryApi.client'
import { librarySessionPath } from '../lib/libraryPaths'
import type { LibraryTree } from '../lib/libraryTree'
import {
  loadCloudSongIntoSession,
  setError,
} from '../lib/sessionActions.client'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'
import { IconPlus } from './icons'
import { LibraryDestinationMenu } from './library/LibraryDestinationMenu'

type NewSessionMenuProps = {
  className?: string
}

export function NewSessionMenu({ className }: NewSessionMenuProps) {
  useLocale()
  const navigate = useNavigate()
  const recording = useSessionStore((s) => s.state === 'recording')
  const [open, setOpen] = useState(false)
  const [tree, setTree] = useState<LibraryTree | null>(null)
  const [loading, setLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const close = () => {
    setOpen(false)
  }

  const loadTree = async () => {
    setLoading(true)
    const next = await fetchLibraryTree()
    setTree(next)
    setLoading(false)
    if (!next) setError(t('library.error'))
  }

  const openMenu = () => {
    if (recording) return
    setTree(null)
    setOpen(true)
    void loadTree()
  }

  const openSession = async (songPartId: string) => {
    setOpen(false)
    navigate(librarySessionPath(songPartId))
    const ok = await loadCloudSongIntoSession(songPartId, { force: true })
    if (!ok) setError(t('library.error'))
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        className={cn(
          'm-0 inline-flex h-[1.85rem] w-[1.85rem] cursor-pointer items-center justify-center rounded-full border border-transparent bg-transparent p-0',
          'text-ink/45 transition-[background,color,border-color] duration-150',
          'hover:border-ink/8 hover:bg-ink/6 hover:text-ink',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
          open && 'border-ink/8 bg-ink/6 text-ink',
          recording && 'cursor-not-allowed opacity-35 hover:border-transparent hover:bg-transparent hover:text-ink/45',
          '[&_svg]:size-[1.05rem]',
        )}
        aria-label={t('deck.newSession')}
        title={t('deck.newSession')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={recording}
        onClick={() => {
          if (open) close()
          else openMenu()
        }}
      >
        <IconPlus />
      </button>
      {open ? (
        <LibraryDestinationMenu
          open={open}
          tree={tree}
          loading={loading}
          dismissRef={rootRef}
          menuId={menuId}
          ariaLabel={t('deck.newSession')}
          terminalLevel="session"
          placement="absolute"
          onClose={close}
          onReloadTree={loadTree}
          onError={() => setError(t('library.error'))}
          onOpenSongPart={openSession}
        />
      ) : null}
    </div>
  )
}
