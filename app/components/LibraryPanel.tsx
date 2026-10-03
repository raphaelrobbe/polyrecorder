import { useNavigate, useRouteLoaderData } from '@remix-run/react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useLocale } from '../hooks/useLocale'
import { readAlignPrefs } from '../lib/alignPrefs'
import { t, tp } from '../lib/i18n'
import { clearLocalDeckSession, loadCloudSongIntoSession, refreshOpenDeckForSong, syncDeckLabelsAfterLibraryRename } from '../lib/sessionActions.client'
import { librarySessionPath } from '../lib/libraryPaths'
import { cn } from '../lib/utils'
import type { loader as rootLoader } from '../root'
import { useSessionStore } from '../store/sessionStore'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { IconChevron } from './icons'
import { ErrorBanner } from './StatusMessage'
import {
  AddLeafRow,
  AddNodeRow,
  accordionControlClass,
} from './library/LibraryAddRows'
import {
  DeleteIconButton,
  LibraryDragHandle,
  LibraryNameInput,
} from './library/LibraryRowActions'
import { SongCard } from './library/LibrarySongCard'
import {
  ROOT_PARENT_ID,
  TOUCH_REORDER_THRESHOLD_PX,
  applyLocalReorder,
  dragInfoFromHandle,
  dragRowClass,
  dropTargetFromPoint,
  findActivePath,
  findSongPath,
  moveBefore,
  postLibrary,
  siblingIds,
  songPartLabel,
  toggleId,
  type DragInfo,
  type DragOver,
  type LibraryTree,
  type NodeKind,
} from './library/libraryPanelHelpers'

type LibraryPanelProps = {
  className?: string
}

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
