import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { readAlignPrefs } from '../../lib/alignPrefs'
import { LIBRARY_TITLE_MAX_LEN } from '../../lib/format'
import { useLocale } from '../../hooks/useLocale'
import { t } from '../../lib/i18n'
import { postLibrary } from '../../lib/libraryApi.client'
import type {
  LibraryGroup,
  LibraryRepertoire,
  LibrarySong,
  LibraryTree,
} from '../../lib/libraryTree'
import { cn } from '../../lib/utils'
import { IconCheck, IconChevron, IconPlus } from '../icons'

export type DestinationLevel = 'group' | 'repertoire' | 'song' | 'session'
export type DestinationCreateKind = DestinationLevel

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

export function CreateNameRow({
  defaultLabel,
  allowEmpty = false,
  busy,
  onCancel,
  onCommit,
}: {
  defaultLabel: string
  allowEmpty?: boolean
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
    const emptyOrDefault = !name || name === defaultLabel
    if (emptyOrDefault && !allowEmpty) return
    onCommit(emptyOrDefault ? '' : name)
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

export type LibraryDestinationMenuProps = {
  open: boolean
  tree: LibraryTree | null
  loading: boolean
  /** Trigger wrapper (and absolute menu when placement is absolute). */
  dismissRef: RefObject<HTMLElement | null>
  menuId: string
  ariaLabel: string
  /** `session`: pick song → create part. `song`: pick/create song is terminal. */
  terminalLevel: 'song' | 'session'
  /** Hide this song in the song list (move source). */
  excludeSongId?: string
  /**
   * `absolute`: dropdown under trigger (NewSession).
   * `portal`: fixed panel positioned from `anchorRef` (Move).
   */
  placement: 'absolute' | 'portal'
  /** Required when `placement="portal"`. */
  anchorRef?: RefObject<HTMLElement | null>
  onClose: () => void
  onReloadTree: () => Promise<void>
  onError: () => void
  /** Terminal song pick / create-song-then-move (Move). */
  onSongChosen?: (songId: string) => void | Promise<void>
  /** Open a song part after create (NewSession). */
  onOpenSongPart?: (songPartId: string) => void | Promise<void>
  /** Notify parent when internal busy changes (e.g. disable trigger). */
  onBusyChange?: (busy: boolean) => void
}

export function LibraryDestinationMenu({
  open,
  tree,
  loading,
  dismissRef,
  menuId,
  ariaLabel,
  terminalLevel,
  excludeSongId,
  placement,
  anchorRef,
  onClose,
  onReloadTree,
  onError,
  onSongChosen,
  onOpenSongPart,
  onBusyChange,
}: LibraryDestinationMenuProps) {
  useLocale()
  const [busy, setBusy] = useState(false)
  const [level, setLevel] = useState<DestinationLevel>('group')
  const [groupId, setGroupId] = useState<string | null>(null)
  const [repertoireId, setRepertoireId] = useState<string | null>(null)
  const [songId, setSongId] = useState<string | null>(null)
  const [creating, setCreating] = useState<DestinationCreateKind | null>(null)
  const [fixedPlacement, setFixedPlacement] = useState<MenuPlacement | null>(
    null,
  )
  const menuRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      onBusyChange?.(false)
    }
  }, [onBusyChange])

  const setBusyState = (next: boolean) => {
    if (mountedRef.current) setBusy(next)
    onBusyChange?.(next)
  }

  const updatePlacement = () => {
    if (placement !== 'portal') return
    const button = anchorRef?.current
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
    setFixedPlacement(
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
    if (!open || placement !== 'portal') return
    updatePlacement()
  }, [open, placement, level, creating, loading, tree])

  useEffect(() => {
    if (!open) return
    const onDocPointer = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (dismissRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (creating) {
        if (level === 'session') {
          setCreating(null)
          setSongId(null)
          setLevel('song')
          return
        }
        setCreating(null)
        return
      }
      onClose()
    }
    document.addEventListener('pointerdown', onDocPointer)
    document.addEventListener('keydown', onKey)
    if (placement === 'portal') {
      const onReposition = () => updatePlacement()
      window.addEventListener('resize', onReposition)
      window.addEventListener('scroll', onReposition, true)
      return () => {
        document.removeEventListener('pointerdown', onDocPointer)
        document.removeEventListener('keydown', onKey)
        window.removeEventListener('resize', onReposition)
        window.removeEventListener('scroll', onReposition, true)
      }
    }
    return () => {
      document.removeEventListener('pointerdown', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, creating, level, placement, dismissRef, onClose])

  // Session level always shows the create input.
  useEffect(() => {
    if (open && level === 'session' && creating !== 'session') {
      setCreating('session')
    }
  }, [open, level, creating])

  if (!open) return null
  if (placement === 'portal' && !fixedPlacement) return null

  const group: LibraryGroup | undefined = tree?.groups.find((g) => g.id === groupId)
  const repertoire: LibraryRepertoire | undefined = group?.repertoires.find(
    (r) => r.id === repertoireId,
  )
  const song: LibrarySong | undefined = repertoire?.songs.find((s) => s.id === songId)

  const goBack = () => {
    setCreating(null)
    if (level === 'session') {
      setSongId(null)
      setLevel('song')
      return
    }
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
        : level === 'song'
          ? t('library.addSong')
          : t('library.addSongPart')

  const parentLabel =
    level === 'repertoire'
      ? group?.name
      : level === 'song'
        ? repertoire?.name
        : level === 'session'
          ? song?.name
          : null

  const items: { id: string; label: string }[] =
    level === 'group'
      ? (tree?.groups.map((g) => ({ id: g.id, label: g.name })) ?? [])
      : level === 'repertoire'
        ? (group?.repertoires.map((r) => ({ id: r.id, label: r.name })) ?? [])
        : level === 'song'
          ? (repertoire?.songs
              .filter((s) => (excludeSongId ? s.id !== excludeSongId : true))
              .map((s) => ({ id: s.id, label: s.name })) ?? [])
          : []

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
      if (terminalLevel === 'session') {
        setSongId(id)
        setLevel('session')
        setCreating('session')
        return
      }
      setBusyState(true)
      void Promise.resolve(onSongChosen?.(id)).finally(() => {
        setBusyState(false)
      })
    }
  }

  const onCreateCommit = (name: string) => {
    if (busy) return
    setBusyState(true)

    const fail = () => {
      onError()
      setBusyState(false)
    }

    if (creating === 'group') {
      void postLibrary({ intent: 'createGroup', name }).then(async (r) => {
        if (!r.ok || !r.id) return fail()
        await onReloadTree()
        setCreating(null)
        setGroupId(r.id)
        setLevel('repertoire')
        setBusyState(false)
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
        await onReloadTree()
        setCreating(null)
        setRepertoireId(r.id)
        setLevel('song')
        setBusyState(false)
      })
      return
    }

    if (creating === 'song' && repertoireId) {
      if (terminalLevel === 'session') {
        const alignPrefs = readAlignPrefs()
        void postLibrary({
          intent: 'createSong',
          repertoireId,
          name,
          alignPrefs,
        }).then(async (r) => {
          if (!r.ok || !r.defaultPartId) return fail()
          setBusyState(false)
          await onOpenSongPart?.(r.defaultPartId)
        })
        return
      }
      void postLibrary({
        intent: 'createSong',
        repertoireId,
        name,
        createDefaultPart: false,
      }).then(async (r) => {
        if (!r.ok || !r.id) return fail()
        try {
          await onSongChosen?.(r.id)
        } finally {
          setBusyState(false)
        }
      })
      return
    }

    if (creating === 'session' && songId) {
      const alignPrefs = readAlignPrefs()
      void postLibrary({
        intent: 'createSongPart',
        songId,
        name,
        alignPrefs,
      }).then(async (r) => {
        if (!r.ok || !r.id) return fail()
        setBusyState(false)
        await onOpenSongPart?.(r.id)
      })
      return
    }

    setBusyState(false)
  }

  const isPortal = placement === 'portal'
  const panelStyle: CSSProperties | undefined = isPortal
    ? {
        top: fixedPlacement!.top,
        bottom: fixedPlacement!.bottom,
        left: fixedPlacement!.left,
        width: fixedPlacement!.width,
        maxHeight: fixedPlacement!.maxHeight,
      }
    : undefined

  const panel = (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      aria-label={ariaLabel}
      className={cn(
        'overflow-hidden rounded-[12px] border border-line bg-surface p-[0.25rem]',
        'shadow-[0_10px_28px_var(--shadow)]',
        isPortal
          ? 'fixed z-[80] flex flex-col'
          : 'absolute right-0 top-[calc(100%+0.3rem)] z-30 w-[min(16.5rem,calc(100vw-2rem))]',
      )}
      style={panelStyle}
      onClick={isPortal ? (event) => event.stopPropagation() : undefined}
      onPointerDown={
        isPortal ? (event) => event.stopPropagation() : undefined
      }
    >
      {level !== 'group' ? (
        <button
          type="button"
          className={cn(
            itemBtnClass,
            'gap-[0.35rem] text-ink-soft hover:text-ink',
            isPortal && 'shrink-0',
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
        <p
          className={cn(
            'm-0 px-[0.55rem] py-[0.55rem] text-[0.78rem] font-semibold text-ink-soft',
            isPortal && 'shrink-0',
          )}
        >
          {t('library.opening')}
        </p>
      ) : (
        <div
          className={
            isPortal
              ? 'min-h-0 flex-1 overflow-y-auto'
              : 'max-h-[min(18rem,50vh)] overflow-y-auto'
          }
        >
          {level !== 'session'
            ? items.map((item) => (
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
              ))
            : null}

          {creating ? (
            <CreateNameRow
              defaultLabel={createAddLabel}
              allowEmpty={creating === 'session'}
              busy={busy}
              onCancel={() => {
                if (level === 'session') {
                  goBack()
                  return
                }
                setCreating(null)
              }}
              onCommit={onCreateCommit}
            />
          ) : level !== 'session' ? (
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
          ) : null}
        </div>
      )}
    </div>
  )

  if (isPortal) {
    return createPortal(panel, document.body)
  }
  return panel
}
