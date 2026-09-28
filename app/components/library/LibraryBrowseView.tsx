import { useNavigate, useRevalidator } from '@remix-run/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocale } from '../../hooks/useLocale'
import { postLibrary } from '../../lib/libraryApi.client'
import { t } from '../../lib/i18n'
import { getDeckHomePath, clearLocalDeckSession } from '../../lib/sessionActions.client'
import { withShortcut } from '../../lib/withShortcut'
import { cn } from '../../lib/utils'
import { useSessionStore } from '../../store/sessionStore'
import {
  LibraryBreadcrumb,
  type BreadcrumbItem,
} from './LibraryBreadcrumb'
import {
  LibraryLevelGrid,
  type LibraryLevelItem,
} from './LibraryLevelGrid'

export type LibraryNodeKind = 'group' | 'repertoire' | 'song' | 'songPart'

type LibraryBrowseViewProps = {
  breadcrumb: BreadcrumbItem[]
  /** Level heading, e.g. « Groupes », « Sessions ». */
  levelTitle: string
  items: LibraryLevelItem[]
  emptyLabel: string
  canEdit: boolean
  addLabel: string
  /** Node kind for rename / delete / reorder. */
  itemKind?: LibraryNodeKind
  /** Parent id for reorder sibling scope (group / repertoire / song id). */
  reorderParentId?: string
  /** Prompt default / create payload builder. Returns path to navigate after create. */
  onCreate?: () => Promise<string | null>
  /** After delete, navigate here (parent level). */
  afterDeleteTo?: string
  /** Extra controls next to the level title (e.g. visibility / collab). */
  headerActions?: ReactNode
  className?: string
  trailing?: ReactNode
}

export function LibraryBrowseView({
  breadcrumb,
  levelTitle,
  items,
  emptyLabel,
  canEdit,
  addLabel,
  itemKind,
  reorderParentId,
  onCreate,
  afterDeleteTo,
  headerActions,
  className,
  trailing,
}: LibraryBrowseViewProps) {
  useLocale()
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  const deckSongId = useSessionStore((s) => s.deckSongId)
  const patch = useSessionStore((s) => s.patch)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const closeLabel = t('common.close')

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  const refresh = () => {
    revalidator.revalidate()
  }

  const handleAdd = () => {
    if (!onCreate || busy) return
    setBusy(true)
    setError(null)
    void onCreate()
      .then((nextPath) => {
        if (nextPath) {
          navigate(nextPath)
          return
        }
        refresh()
      })
      .catch(() => {
        setError(t('library.error'))
      })
      .finally(() => {
        setBusy(false)
      })
  }

  const handleRename = (item: LibraryLevelItem, name: string) => {
    if (!itemKind || busy) return
    const allowEmpty = Boolean(item.allowEmptyTitle)
    const trimmed = name.trim()
    if (!allowEmpty && !trimmed) return
    if (trimmed === item.title.trim()) return
    setBusy(true)
    setError(null)
    void postLibrary({
      intent: 'rename',
      kind: itemKind,
      id: item.id,
      name: trimmed,
    })
      .then((result) => {
        if (!result.ok) throw new Error('rename failed')
        refresh()
      })
      .catch(() => setError(t('library.error')))
      .finally(() => setBusy(false))
  }

  const handleDelete = (item: LibraryLevelItem) => {
    if (!itemKind || busy) return
    const confirmName =
      item.title.trim() || item.titlePlaceholder || item.title
    const confirmKey =
      itemKind === 'songPart'
        ? 'library.deleteSongPartConfirm'
        : 'library.deleteConfirm'
    if (!window.confirm(t(confirmKey, { name: confirmName }))) return
    setBusy(true)
    setError(null)
    void postLibrary({
      intent: 'delete',
      kind: itemKind,
      id: item.id,
    })
      .then((result) => {
        if (!result.ok) throw new Error('delete failed')
        const {
          deckSongId: deckSong,
          deckSongPartId,
          activeSongPartId,
          deckLibraryPath,
        } = useSessionStore.getState()
        const deletedActiveSong =
          itemKind === 'song' && item.id === deckSong
        const deletedActivePart =
          itemKind === 'songPart' &&
          (item.id === deckSongPartId || item.id === activeSongPartId)
        const deletedActiveRepertoire =
          itemKind === 'repertoire' &&
          deckLibraryPath != null &&
          item.id === deckLibraryPath.repertoireId
        const deletedActiveGroup =
          itemKind === 'group' &&
          deckLibraryPath != null &&
          item.id === deckLibraryPath.groupId
        if (
          deletedActiveSong ||
          deletedActivePart ||
          deletedActiveRepertoire ||
          deletedActiveGroup
        ) {
          clearLocalDeckSession()
        }
        if (afterDeleteTo) navigate(afterDeleteTo)
        else refresh()
      })
      .catch(() => setError(t('library.error')))
      .finally(() => setBusy(false))
  }

  const handleReorder = (id: string, beforeId: string | null) => {
    if (!itemKind) return
    if (
      itemKind === 'songPart' &&
      reorderParentId &&
      reorderParentId === deckSongId
    ) {
      const ids = items.map((item) => item.id)
      const rest = ids.filter((candidate) => candidate !== id)
      const insertAt = beforeId == null ? rest.length : rest.indexOf(beforeId)
      const ordered = [
        ...rest.slice(0, insertAt < 0 ? rest.length : insertAt),
        id,
        ...rest.slice(insertAt < 0 ? rest.length : insertAt),
      ]
      const byId = new Map(items.map((item) => [item.id, item]))
      patch({
        deckSongPartSiblings: ordered.map((partId) => {
          const item = byId.get(partId)
          return {
            id: partId,
            name: item?.title.trim() ? item.title : null,
          }
        }),
      })
    }
    void postLibrary({
      intent: 'reorder',
      kind: itemKind,
      id,
      beforeId,
    }).then((result) => {
      if (!result.ok) {
        setError(t('library.error'))
        refresh()
      }
    })
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="relative mb-3">
        <LibraryBreadcrumb
          items={breadcrumb}
          className="mb-0 px-[2.75rem]"
        />
        <button
          ref={closeRef}
          type="button"
          className="absolute right-0 top-1/2 z-[2] m-0 grid h-[2.4rem] w-[2.4rem] -translate-y-1/2 place-items-center rounded-[12px] border-0 bg-transparent p-0 text-[1.85rem] font-normal leading-none text-ink-soft cursor-pointer transition-[background,color] duration-[160ms] ease-in-out hover:bg-ink/8 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2"
          aria-label={t('library.close')}
          title={withShortcut(closeLabel, 'Échap', keyboardHintsEnabled)}
          data-title-base={closeLabel}
          onClick={() => navigate(getDeckHomePath())}
        >
          ×
        </button>
      </div>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="m-0 text-[0.72rem] font-extrabold uppercase tracking-[0.09em] text-ink/55">
          {levelTitle}
        </h2>
        {headerActions}
      </div>
      {error ? (
        <p className="m-0 mb-2 text-center text-[0.82rem] font-semibold text-ink-soft">
          {error}
        </p>
      ) : null}
      <LibraryLevelGrid
        items={items}
        emptyLabel={emptyLabel}
        canEdit={canEdit}
        addLabel={addLabel}
        parentId={reorderParentId}
        brandBorderDir={
          itemKind === 'repertoire' || itemKind === 'songPart'
            ? 'desc'
            : 'asc'
        }
        onAdd={canEdit && onCreate ? handleAdd : undefined}
        onRename={canEdit && itemKind ? handleRename : undefined}
        onDelete={canEdit && itemKind ? handleDelete : undefined}
        onReorder={canEdit && itemKind ? handleReorder : undefined}
        trailing={trailing}
      />
    </div>
  )
}

export { postLibrary } from '../../lib/libraryApi.client'
