import { useNavigate, useRouteLoaderData } from '@remix-run/react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useLocale } from '../hooks/useLocale'
import { writeActiveSongId } from '../lib/cloudPrefs'
import { t, tp } from '../lib/i18n'
import { loadCloudSongIntoSession } from '../lib/sessionActions.client'
import { cn } from '../lib/utils'
import type { loader as rootLoader } from '../root'
import { useSessionStore } from '../store/sessionStore'
import { Button } from './Button'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { IconChevron, IconGlobe, IconShare, IconTrash } from './icons'
import { ErrorBanner } from './StatusMessage'

type LibraryTree = {
  groups: Array<{
    id: string
    name: string
    repertoires: Array<{
      id: string
      name: string
      songs: Array<{
        id: string
        name: string
        isPublic: boolean
        trackNames: string[]
        lastOpenedAt: string
        updatedAt: string
      }>
    }>
  }>
}

type LibraryPanelProps = {
  className?: string
}

type RenameKind = 'group' | 'repertoire' | 'song'

async function postLibrary(body: Record<string, unknown>) {
  const res = await fetch('/api/cloud/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<{ ok: boolean; reason?: string; id?: string }>
}

function findActivePath(
  tree: LibraryTree,
  activeSongId: string | null,
): { groupId: string; repertoireId: string } | null {
  if (!activeSongId) return null
  for (const group of tree.groups) {
    for (const rep of group.repertoires) {
      if (rep.songs.some((song) => song.id === activeSongId)) {
        return { groupId: group.id, repertoireId: rep.id }
      }
    }
  }
  return null
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
        'relative z-[1] shrink-0 border-ink/20 text-ink/60 [&_svg]:size-[1.05rem]',
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

function SongShareButton({
  songId,
  songName,
  isPublic,
  onOpenChange,
}: {
  songId: string
  songName: string
  isPublic: boolean
  onOpenChange?: (open: boolean) => void
}) {
  useLocale()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

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
      ? `${window.location.origin}/song/${songId}`
      : `/song/${songId}`

  return (
    <div className="relative pointer-events-auto" ref={panelRef}>
      <button
        type="button"
        className={songActionBtnClass}
        aria-label={t('library.share')}
        title={
          isPublic ? t('library.share') : t('library.share.disabled')
        }
        disabled={!isPublic}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          if (!isPublic) return
          setShareOpen(!open)
          setCopied(false)
        }}
      >
        <IconShare />
      </button>
      {open && isPublic ? (
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
          <a
            className="m-0 flex w-full items-center rounded-[8px] px-2 py-1.5 text-left text-[0.82rem] font-semibold text-ink no-underline hover:bg-ink/6"
            href={`https://wa.me/?text=${encodeURIComponent(`${songName} — ${shareUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setShareOpen(false)}
          >
            {t('library.share.whatsapp')}
          </a>
          {typeof navigator !== 'undefined' &&
          typeof navigator.share === 'function' ? (
            <button
              type="button"
              className="m-0 flex w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2 py-1.5 text-left text-[0.82rem] font-semibold text-ink hover:bg-ink/6"
              onClick={() => {
                void navigator
                  .share({
                    title: songName,
                    url: shareUrl,
                    text: songName,
                  })
                  .catch(() => {})
                setShareOpen(false)
              }}
            >
              {t('library.share.native')}
            </button>
          ) : null}
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

function SongCard({
  song,
  isActive,
  isBusy,
  onOpen,
  onRename,
  onDelete,
  onVisibilityError,
  onVisibilityChanged,
}: {
  song: {
    id: string
    name: string
    isPublic: boolean
    trackNames: string[]
  }
  isActive: boolean
  isBusy: boolean
  onOpen: () => void
  onRename: (name: string) => void
  onDelete: () => void
  onVisibilityError: () => void
  onVisibilityChanged: () => void
}) {
  useLocale()
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <li
      className={cn(
        'relative rounded-[10px] bg-ink/[0.06] px-1.5 py-1',
        isActive && 'bg-ink/[0.1]',
        isBusy && 'opacity-60',
        shareOpen && 'z-30',
      )}
    >
      <button
        type="button"
        disabled={isBusy}
        aria-busy={isBusy || undefined}
        aria-label={`${t('library.open')} — ${song.name}`}
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
          <LibraryNameInput
            value={song.name}
            ariaLabel={t('library.song')}
            className="pointer-events-auto text-[0.9rem] font-medium text-ink"
            onCommit={onRename}
          />
        </div>
        <SongVisibilityButton
          songId={song.id}
          isPublic={song.isPublic}
          onError={onVisibilityError}
          onChanged={onVisibilityChanged}
        />
        <SongShareButton
          songId={song.id}
          songName={song.name}
          isPublic={song.isPublic}
          onOpenChange={setShareOpen}
        />
        <DeleteIconButton
          className="pointer-events-auto"
          label={t('library.delete')}
          onClick={onDelete}
        />
      </div>

      {isBusy ? (
        <div className="relative mt-1 pointer-events-none">
          <span className="text-[0.75rem] font-normal text-ink-soft">
            {t('library.opening')}
          </span>
        </div>
      ) : song.trackNames.length > 0 ? (
        <div className="relative mt-1 pointer-events-none">
          <span className="flex flex-wrap gap-1">
            {song.trackNames.map((trackName, index) => (
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

function AddNodeRow({
  defaultLabel,
  levelLabel,
  levelLabelClassName,
  inputClassName,
  create,
  onCreated,
  onError,
  className,
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
}) {
  useLocale()
  const [draft, setDraft] = useState(defaultLabel)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isDefault = draft.trim() === defaultLabel

  useEffect(() => {
    setDraft(defaultLabel)
  }, [defaultLabel])

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
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={defaultLabel}
          title={defaultLabel}
          disabled={busy}
          onClick={focusAndSelect}
          className={cn(
            accordionControlClass,
            'text-[1.25rem] font-medium leading-none',
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
          <input
            ref={inputRef}
            type="text"
            value={draft}
            disabled={busy}
            aria-label={defaultLabel}
            maxLength={80}
            spellCheck={false}
            className={cn(
              'm-0 mt-0.5 w-auto max-w-full min-w-[5.5ch] rounded-[8px] border-0 bg-transparent py-[0.1rem] pl-0 pr-9 font-[inherit] field-sizing-content',
              'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none',
              'focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
              'disabled:opacity-55',
              isDefault
                ? 'italic font-medium text-ink/45 [font-synthesis:style]'
                : 'text-ink',
              inputClassName,
            )}
            onChange={(event) => setDraft(event.target.value)}
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
}: {
  groupId: string
  onCreated: (id: string) => void
  onError: () => void
}) {
  useLocale()
  return (
    <AddNodeRow
      defaultLabel={t('library.addRepertoire')}
      levelLabel={t('library.repertoire')}
      inputClassName="text-[1.02rem] font-semibold tracking-[-0.01em]"
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
}: {
  onCreated: (id: string) => void
  onError: () => void
  className?: string
}) {
  useLocale()
  return (
    <AddNodeRow
      className={className}
      defaultLabel={t('library.addGroup')}
      levelLabel={t('library.group')}
      levelLabelClassName="text-[0.7rem] font-extrabold tracking-[0.09em] text-ink/55"
      inputClassName="font-display text-[1.28rem] font-bold tracking-[-0.02em]"
      create={(name) => postLibrary({ intent: 'createGroup', name })}
      onCreated={onCreated}
      onError={onError}
    />
  )
}

function AddSongRow({
  repertoireId,
  onCreated,
  onError,
}: {
  repertoireId: string
  onCreated: () => void
  onError: () => void
}) {
  useLocale()
  const defaultLabel = t('library.addSong')
  const [draft, setDraft] = useState(defaultLabel)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isDefault = draft.trim() === defaultLabel

  useEffect(() => {
    setDraft(defaultLabel)
  }, [defaultLabel])

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
    void postLibrary({
      intent: 'createSong',
      repertoireId,
      name,
    })
      .then((r) => {
        if (!r.ok) {
          onError()
          setDraft(defaultLabel)
          return
        }
        setDraft(defaultLabel)
        onCreated()
      })
      .finally(() => {
        setBusy(false)
      })
  }

  return (
    <li className="rounded-[10px] bg-ink/[0.06] px-1.5 py-1">
      <div className="flex min-w-0 items-center gap-1.5">
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
        <input
          ref={inputRef}
          type="text"
          value={draft}
          disabled={busy}
          aria-label={defaultLabel}
          maxLength={80}
          spellCheck={false}
          className={cn(
            'm-0 w-auto max-w-full min-w-[5.5ch] rounded-[8px] border-0 bg-transparent py-[0.1rem] pl-[0.15rem] pr-9 font-[inherit] field-sizing-content',
            'text-[0.9rem]',
            'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none',
            'focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
            'disabled:opacity-55',
            isDefault
              ? 'italic font-medium text-ink/45 [font-synthesis:style]'
              : 'font-medium text-ink',
          )}
          onChange={(event) => setDraft(event.target.value)}
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
}: {
  value: string
  ariaLabel: string
  className?: string
  onCommit: (next: string) => void
}) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  return (
    <input
      type="text"
      value={draft}
      aria-label={ariaLabel}
      maxLength={80}
      spellCheck={false}
      className={cn(
        'relative z-[1] m-0 w-auto max-w-full min-w-[5.5ch] rounded-[8px] border-0 bg-transparent py-[0.1rem] pl-[0.25rem] pr-9 font-[inherit] text-inherit field-sizing-content',
        'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none',
        'focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
        className,
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
        const next = draft.trim() || value
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
  const activeSongId = useSessionStore((s) => s.activeSongId)
  const setActiveSongId = useSessionStore((s) => s.setActiveSongId)
  const setSessionTitle = useSessionStore((s) => s.setSessionTitle)
  const error = useSessionStore((s) => s.error)
  const setError = useSessionStore((s) => s.setError)

  const [tree, setTree] = useState<LibraryTree | null>(null)
  const [loading, setLoading] = useState(true)
  const [busySongId, setBusySongId] = useState<string | null>(null)
  const [openGroupIds, setOpenGroupIds] = useState<Set<string>>(() => new Set())
  const [openRepIds, setOpenRepIds] = useState<Set<string>>(() => new Set())
  const [accordionSeeded, setAccordionSeeded] = useState(false)
  const treeRef = useRef(tree)
  treeRef.current = tree

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
    const path = findActivePath(tree, activeSongId)
    if (path) {
      setOpenGroupIds((prev) => new Set(prev).add(path.groupId))
      setOpenRepIds((prev) => new Set(prev).add(path.repertoireId))
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
  }, [tree, activeSongId, accordionSeeded])

  const applyLocalRename = useCallback(
    (kind: RenameKind, id: string, name: string) => {
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
                  songs: rep.songs.map((song) =>
                    kind === 'song' && song.id === id
                      ? { ...song, name }
                      : song,
                  ),
                }
              }),
            }
          }),
        }
      })
      if (kind === 'song' && id === activeSongId) {
        setSessionTitle(name)
      }
    },
    [activeSongId, setSessionTitle],
  )

  const renameNode = useCallback(
    (kind: RenameKind, id: string, name: string) => {
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

  const onOpenSong = async (songId: string) => {
    setBusySongId(songId)
    setError(null)
    try {
      const ok = await loadCloudSongIntoSession(songId)
      if (ok) navigate('/')
    } finally {
      setBusySongId(null)
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
      {error ? <ErrorBanner className="mt-0">{error}</ErrorBanner> : null}
      {loading ? (
        <p className="m-0 text-[0.9rem] text-ink-soft">{t('library.opening')}</p>
      ) : !tree ? (
        <p className="m-0 text-[0.9rem] text-ink-soft">{t('library.empty')}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {tree.groups.map((group) => {
            const groupOpen = openGroupIds.has(group.id)
            return (
              <li
                key={group.id}
                className="mb-5 border-b border-line/60 pb-5"
              >
                <div
                  className="flex cursor-pointer items-center gap-1.5"
                  onClick={() =>
                    setOpenGroupIds((prev) => toggleId(prev, group.id))
                  }
                >
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
                  <ul className="m-0 mt-3.5 flex list-none flex-col gap-4 border-l-[2.5px] border-ink/18 p-0 pl-3.5 ml-2.5">
                    {group.repertoires.map((rep) => {
                      const repOpen = openRepIds.has(rep.id)
                      return (
                        <li key={rep.id}>
                          <div
                            className="flex cursor-pointer items-center gap-1.5"
                            onClick={() =>
                              setOpenRepIds((prev) => toggleId(prev, rep.id))
                            }
                          >
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
                            <ul className="m-0 mt-2.5 flex list-none flex-col gap-2.5 p-0 pl-[calc(2.05rem+0.375rem)]">
                              {rep.songs.map((song) => (
                                <SongCard
                                  key={song.id}
                                  song={song}
                                  isActive={song.id === activeSongId}
                                  isBusy={busySongId === song.id}
                                  onOpen={() => void onOpenSong(song.id)}
                                  onRename={(name) =>
                                    renameNode('song', song.id, name)
                                  }
                                  onDelete={() => {
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
                                      if (song.id === activeSongId) {
                                        writeActiveSongId(null)
                                        setActiveSongId(null)
                                      }
                                      void reload()
                                    })
                                  }}
                                  onVisibilityError={() =>
                                    setError(t('library.error'))
                                  }
                                  onVisibilityChanged={() => {
                                    void reload()
                                  }}
                                />
                              ))}
                              <AddSongRow
                                repertoireId={rep.id}
                                onError={() => setError(t('library.error'))}
                                onCreated={() => {
                                  setOpenRepIds((prev) =>
                                    new Set(prev).add(rep.id),
                                  )
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
