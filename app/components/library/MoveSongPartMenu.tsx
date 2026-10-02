import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LIBRARY_TITLE_MAX_LEN } from '../../lib/format'
import { useLocale } from '../../hooks/useLocale'
import { t } from '../../lib/i18n'
import {
  fetchLibraryTree,
  postLibrary,
} from '../../lib/libraryApi.client'
import type {
  LibraryGroup,
  LibraryRepertoire,
  LibraryTree,
} from '../../lib/libraryTree'
import {
  loadCloudSongIntoSession,
} from '../../lib/sessionActions.client'
import { useSessionStore } from '../../store/sessionStore'
import { cn } from '../../lib/utils'
import { IconCheck, IconChevron, IconMove, IconPlus } from '../icons'

type Level = 'group' | 'repertoire' | 'song'

type CreateKind = Level

const MENU_GAP_PX = 5
const MENU_EDGE_PX = 8
const MENU_WIDTH_REM = 16.5

const itemBtnClass = cn(
  'flex w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-[0.55rem] py-[0.45rem] text-left font-[inherit] text-[0.82rem] font-semibold leading-normal text-ink',
  'hover:bg-ink/6',
  'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent',
)

const iconBtnClass = cn(
  'm-0 inline-flex h-[1.7rem] w-[1.7rem] shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 text-ink/55',
  'hover:bg-ink/8 hover:text-ink',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
  '[&_svg]:size-[0.95rem]',
)

type MenuPlacement = {
  top?: number
  bottom?: number
  left: number
  width: number
  maxHeight: number
}

function CreateNameRow({
  defaultLabel,
  busy,
  onCancel,
  onCommit,
}: {
  defaultLabel: string
  busy: boolean
  onCancel: () => void
  onCommit: (name: string) => void
}) {
  useLocale()
  const [draft, setDraft] = useState(defaultLabel)
  const inputRef = useRef<HTMLInputElement>(null)
  const isDefault = draft.trim() === defaultLabel

  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.focus()
    el.select()
  }, [])

  const commit = () => {
    if (busy) return
    const name = draft.trim()
    if (!name || name === defaultLabel) return
    onCommit(name)
  }

  return (
    <div className="flex items-center gap-[0.2rem] px-[0.3rem] py-[0.2rem]">
      <input
        ref={inputRef}
        type="text"
        value={draft}
        disabled={busy}
        maxLength={LIBRARY_TITLE_MAX_LEN}
        aria-label={defaultLabel}
        spellCheck={false}
        className={cn(
          'm-0 min-w-0 flex-1 rounded-[8px] border-0 bg-transparent px-[0.35rem] py-[0.35rem] font-[inherit] text-[0.82rem] font-semibold leading-normal text-ink',
          'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none',
          'focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
          'disabled:opacity-55',
          isDefault && 'italic font-medium text-ink/45',
        )}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            onCancel()
          }
        }}
      />
      <button
        type="button"
        className={iconBtnClass}
        disabled={busy}
        aria-label={t('common.validate')}
        title={t('common.validate')}
        onClick={commit}
      >
        <IconCheck />
      </button>
    </div>
  )
}

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
  const [level, setLevel] = useState<Level>('group')
  const [groupId, setGroupId] = useState<string | null>(null)
  const [repertoireId, setRepertoireId] = useState<string | null>(null)
  const [creating, setCreating] = useState<CreateKind | null>(null)
  const [placement, setPlacement] = useState<MenuPlacement | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const resetCascade = () => {
    setLevel('group')
    setGroupId(null)
    setRepertoireId(null)
    setCreating(null)
  }

  const setMenuOpen = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
    if (!next) {
      resetCascade()
      setPlacement(null)
    }
  }

  const updatePlacement = () => {
    const button = buttonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    const width = Math.min(
      MENU_WIDTH_REM * 16,
      window.innerWidth - MENU_EDGE_PX * 2,
    )
    const spaceBelow =
      window.innerHeight - rect.bottom - MENU_GAP_PX - MENU_EDGE_PX
    const spaceAbove = rect.top - MENU_GAP_PX - MENU_EDGE_PX
    const preferredMax = Math.min(18 * 16, window.innerHeight * 0.5)
    const openAbove = spaceBelow < 140 && spaceAbove > spaceBelow
    const maxHeight = Math.max(
      96,
      Math.min(preferredMax, openAbove ? spaceAbove : spaceBelow),
    )
    let left = rect.right - width
    left = Math.max(
      MENU_EDGE_PX,
      Math.min(left, window.innerWidth - width - MENU_EDGE_PX),
    )
    setPlacement(
      openAbove
        ? {
            bottom: window.innerHeight - rect.top + MENU_GAP_PX,
            left,
            width,
            maxHeight,
          }
        : {
            top: rect.bottom + MENU_GAP_PX,
            left,
            width,
            maxHeight,
          },
    )
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePlacement()
  }, [open, level, creating, loading, tree])

  useEffect(() => {
    if (!open) return
    const onDocPointer = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setMenuOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (creating) {
        setCreating(null)
        return
      }
      setMenuOpen(false)
    }
    const onReposition = () => updatePlacement()
    document.addEventListener('pointerdown', onDocPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onReposition)
    // Capture scroll from nested library lists without listening on every node.
    window.addEventListener('scroll', onReposition, true)
    return () => {
      document.removeEventListener('pointerdown', onDocPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, creating])

  const loadTree = async () => {
    setLoading(true)
    const next = await fetchLibraryTree()
    setTree(next)
    setLoading(false)
    if (!next) onError?.()
  }

  const openMenu = () => {
    resetCascade()
    setMenuOpen(true)
    void loadTree()
  }

  const group: LibraryGroup | undefined = tree?.groups.find((g) => g.id === groupId)
  const repertoire: LibraryRepertoire | undefined = group?.repertoires.find(
    (r) => r.id === repertoireId,
  )

  const goBack = () => {
    setCreating(null)
    if (level === 'song') {
      setRepertoireId(null)
      setLevel('repertoire')
      return
    }
    if (level === 'repertoire') {
      setGroupId(null)
      setLevel('group')
    }
  }

  const createAddLabel =
    level === 'group'
      ? t('library.addGroup')
      : level === 'repertoire'
        ? t('library.addRepertoire')
        : t('library.addSong')

  const parentLabel =
    level === 'repertoire'
      ? group?.name
      : level === 'song'
        ? repertoire?.name
        : null

  const items: { id: string; label: string }[] =
    level === 'group'
      ? (tree?.groups.map((g) => ({ id: g.id, label: g.name })) ?? [])
      : level === 'repertoire'
        ? (group?.repertoires.map((r) => ({ id: r.id, label: r.name })) ?? [])
        : (repertoire?.songs
            .filter((s) => s.id !== sourceSongId)
            .map((s) => ({ id: s.id, label: s.name })) ?? [])

  const finishMove = async (targetSongId: string) => {
    const result = await postLibrary({
      intent: 'moveSongPart',
      id: songPartId,
      targetSongId,
    })
    if (!result.ok || !result.id) {
      onError?.()
      setBusy(false)
      return
    }
    const { deckSongPartId, activeSongPartId } = useSessionStore.getState()
    if (deckSongPartId === songPartId || activeSongPartId === songPartId) {
      void loadCloudSongIntoSession(songPartId, { force: true, quiet: true })
    }
    setBusy(false)
    setMenuOpen(false)
    onMoved?.({ songId: targetSongId })
  }

  const onPick = (id: string) => {
    if (busy || creating) return
    if (level === 'group') {
      setGroupId(id)
      setLevel('repertoire')
      return
    }
    if (level === 'repertoire') {
      setRepertoireId(id)
      setLevel('song')
      return
    }
    if (level === 'song') {
      setBusy(true)
      void finishMove(id)
    }
  }

  const onCreateCommit = (name: string) => {
    if (busy) return
    setBusy(true)

    const fail = () => {
      onError?.()
      setBusy(false)
    }

    if (creating === 'group') {
      void postLibrary({ intent: 'createGroup', name }).then(async (r) => {
        if (!r.ok || !r.id) return fail()
        await loadTree()
        setCreating(null)
        setGroupId(r.id)
        setLevel('repertoire')
        setBusy(false)
      })
      return
    }

    if (creating === 'repertoire' && groupId) {
      void postLibrary({
        intent: 'createRepertoire',
        groupId,
        name,
      }).then(async (r) => {
        if (!r.ok || !r.id) return fail()
        await loadTree()
        setCreating(null)
        setRepertoireId(r.id)
        setLevel('song')
        setBusy(false)
      })
      return
    }

    if (creating === 'song' && repertoireId) {
      void postLibrary({
        intent: 'createSong',
        repertoireId,
        name,
        createDefaultPart: false,
      }).then(async (r) => {
        if (!r.ok || !r.id) return fail()
        await finishMove(r.id)
      })
      return
    }

    setBusy(false)
  }

  const menu =
    open && placement
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={t('library.moveSongPart')}
            className={cn(
              'fixed z-[80] flex flex-col overflow-hidden rounded-[12px] border border-line bg-surface p-[0.25rem]',
              'shadow-[0_10px_28px_var(--shadow)]',
            )}
            style={{
              top: placement.top,
              bottom: placement.bottom,
              left: placement.left,
              width: placement.width,
              maxHeight: placement.maxHeight,
            }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {level !== 'group' ? (
              <button
                type="button"
                className={cn(
                  itemBtnClass,
                  'shrink-0 gap-[0.35rem] text-ink-soft hover:text-ink',
                )}
                disabled={busy}
                onClick={goBack}
              >
                <IconChevron className="size-[0.85rem] rotate-90" />
                <span className="min-w-0 truncate">
                  {parentLabel ?? t('deck.newSession.back')}
                </span>
              </button>
            ) : null}

            {loading && !tree ? (
              <p className="m-0 shrink-0 px-[0.55rem] py-[0.55rem] text-[0.78rem] font-semibold text-ink-soft">
                {t('library.opening')}
              </p>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={itemBtnClass}
                    disabled={busy || Boolean(creating)}
                    onClick={() => onPick(item.id)}
                  >
                    <span className="min-w-0 truncate">{item.label}</span>
                  </button>
                ))}

                {creating ? (
                  <CreateNameRow
                    defaultLabel={createAddLabel}
                    busy={busy}
                    onCancel={() => setCreating(null)}
                    onCommit={onCreateCommit}
                  />
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    className={cn(itemBtnClass, 'gap-[0.4rem] text-ink-soft')}
                    disabled={busy}
                    onClick={() => setCreating(level)}
                  >
                    <IconPlus className="size-[0.9rem]" />
                    <span className="min-w-0 truncate">{createAddLabel}</span>
                  </button>
                )}
              </div>
            )}
          </div>,
          document.body,
        )
      : null

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
      {menu}
    </div>
  )
}
