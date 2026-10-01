import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from '@remix-run/react'
import { readAlignPrefs } from '../lib/alignPrefs'
import { LIBRARY_TITLE_MAX_LEN } from '../lib/format'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import {
  fetchLibraryTree,
  postLibrary,
} from '../lib/libraryApi.client'
import { librarySessionPath } from '../lib/libraryPaths'
import type {
  LibraryGroup,
  LibraryRepertoire,
  LibrarySong,
  LibraryTree,
} from '../lib/libraryTree'
import {
  loadCloudSongIntoSession,
  setError,
} from '../lib/sessionActions.client'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'
import { IconCheck, IconChevron, IconPlus } from './icons'

type NewSessionMenuProps = {
  className?: string
}

type Level = 'group' | 'repertoire' | 'song' | 'session'

type CreateKind = Level

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

function CreateNameRow({
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

export function NewSessionMenu({ className }: NewSessionMenuProps) {
  useLocale()
  const navigate = useNavigate()
  const recording = useSessionStore((s) => s.state === 'recording')
  const [open, setOpen] = useState(false)
  const [tree, setTree] = useState<LibraryTree | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [level, setLevel] = useState<Level>('group')
  const [groupId, setGroupId] = useState<string | null>(null)
  const [repertoireId, setRepertoireId] = useState<string | null>(null)
  const [songId, setSongId] = useState<string | null>(null)
  const [creating, setCreating] = useState<CreateKind | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const resetCascade = () => {
    setLevel('group')
    setGroupId(null)
    setRepertoireId(null)
    setSongId(null)
    setCreating(null)
  }

  const close = () => {
    setOpen(false)
    resetCascade()
  }

  useEffect(() => {
    if (!open) return
    const onDocPointer = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false)
        resetCascade()
      }
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
      setOpen(false)
      resetCascade()
    }
    document.addEventListener('pointerdown', onDocPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, creating, level])

  const loadTree = async () => {
    setLoading(true)
    const next = await fetchLibraryTree()
    setTree(next)
    setLoading(false)
    if (!next) setError(t('library.error'))
  }

  const openMenu = () => {
    if (recording) return
    resetCascade()
    setOpen(true)
    void loadTree()
  }

  const openSession = async (songPartId: string) => {
    setOpen(false)
    resetCascade()
    navigate(librarySessionPath(songPartId))
    const ok = await loadCloudSongIntoSession(songPartId, { force: true })
    if (!ok) setError(t('library.error'))
  }

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
          ? (repertoire?.songs.map((s) => ({ id: s.id, label: s.name })) ?? [])
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
      setSongId(id)
      setLevel('session')
      setCreating('session')
    }
  }

  const onCreateCommit = (name: string) => {
    if (busy) return
    setBusy(true)
    const alignPrefs = readAlignPrefs()

    const fail = () => {
      setError(t('library.error'))
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
        alignPrefs,
      }).then(async (r) => {
        if (!r.ok || !r.defaultPartId) return fail()
        setBusy(false)
        await openSession(r.defaultPartId)
      })
      return
    }

    if (creating === 'session' && songId) {
      void postLibrary({
        intent: 'createSongPart',
        songId,
        name,
        alignPrefs,
      }).then(async (r) => {
        if (!r.ok || !r.id) return fail()
        setBusy(false)
        await openSession(r.id)
      })
      return
    }

    setBusy(false)
  }

  // Session level always shows the create input.
  useEffect(() => {
    if (open && level === 'session' && creating !== 'session') {
      setCreating('session')
    }
  }, [open, level, creating])

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
        <div
          id={menuId}
          role="menu"
          aria-label={t('deck.newSession')}
          className={cn(
            'absolute right-0 top-[calc(100%+0.3rem)] z-30 w-[min(16.5rem,calc(100vw-2rem))] overflow-hidden rounded-[12px] border border-line bg-surface p-[0.25rem]',
            'shadow-[0_10px_28px_var(--shadow)]',
          )}
        >
          {level !== 'group' ? (
            <button
              type="button"
              className={cn(
                itemBtnClass,
                'gap-[0.35rem] text-ink-soft hover:text-ink',
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
            <p className="m-0 px-[0.55rem] py-[0.55rem] text-[0.78rem] font-semibold text-ink-soft">
              {t('library.opening')}
            </p>
          ) : (
            <div className="max-h-[min(18rem,50vh)] overflow-y-auto">
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
      ) : null}
    </div>
  )
}
