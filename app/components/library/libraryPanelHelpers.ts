import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import type { LibrarySong, LibraryTree } from '../../lib/libraryTree'

export type { LibrarySong, LibrarySongPart, LibraryTree } from '../../lib/libraryTree'

export type NodeKind = 'group' | 'repertoire' | 'song' | 'songPart'

/** Row being dragged: reordering never leaves `parentId`. */
export type DragInfo = { kind: NodeKind; id: string; parentId: string }

export type DragOver = { id: string; edge: 'before' | 'after' } | null

/** What the rows need to paint the drag feedback. */
export type DragRender = { draggingId: string | null; dragOver: DragOver }

/** Groups have no parent row — they all share this bucket. */
export const ROOT_PARENT_ID = 'root'

export const TOUCH_REORDER_THRESHOLD_PX = 8

export { postLibrary } from '../../lib/libraryApi.client'

export function findActivePath(
  tree: LibraryTree,
  activeSongPartId: string | null,
): { groupId: string; repertoireId: string; songId: string } | null {
  if (!activeSongPartId) return null
  for (const group of tree.groups) {
    for (const rep of group.repertoires) {
      for (const song of rep.songs) {
        if (song.parts.some((part) => part.id === activeSongPartId)) {
          return {
            groupId: group.id,
            repertoireId: rep.id,
            songId: song.id,
          }
        }
      }
    }
  }
  return null
}

export function findSongPath(
  tree: LibraryTree,
  songId: string,
): { groupId: string; repertoireId: string; songId: string } | null {
  for (const group of tree.groups) {
    for (const rep of group.repertoires) {
      if (rep.songs.some((song) => song.id === songId)) {
        return {
          groupId: group.id,
          repertoireId: rep.id,
          songId,
        }
      }
    }
  }
  return null
}

/** Part used by the share link: the active one, else the latest opened. */
export function shareTargetPartId(
  song: LibrarySong,
  activeSongPartId: string | null,
): string | null {
  const active = song.parts.find((part) => part.id === activeSongPartId)
  if (active) return active.id
  const latest = [...song.parts].sort((a, b) =>
    b.lastOpenedAt.localeCompare(a.lastOpenedAt),
  )[0]
  return latest?.id ?? null
}

/** Sibling ids of one parent, in display order. */
export function siblingIds(
  tree: LibraryTree,
  kind: NodeKind,
  parentId: string,
): string[] {
  if (kind === 'group') return tree.groups.map((group) => group.id)
  if (kind === 'repertoire') {
    const group = tree.groups.find((candidate) => candidate.id === parentId)
    return group?.repertoires.map((rep) => rep.id) ?? []
  }
  const reps = tree.groups.flatMap((group) => group.repertoires)
  if (kind === 'song') {
    const rep = reps.find((candidate) => candidate.id === parentId)
    return rep?.songs.map((song) => song.id) ?? []
  }
  const song = reps
    .flatMap((rep) => rep.songs)
    .find((candidate) => candidate.id === parentId)
  return song?.parts.map((part) => part.id) ?? []
}

/** Sibling ids with `id` moved before `beforeId` (to the end when null). */
export function moveBefore(
  ids: string[],
  id: string,
  beforeId: string | null,
): string[] | null {
  if (!ids.includes(id)) return null
  if (beforeId != null && !ids.includes(beforeId)) return null
  const rest = ids.filter((candidate) => candidate !== id)
  if (beforeId == null) return [...rest, id]
  const index = rest.indexOf(beforeId)
  return [...rest.slice(0, index), id, ...rest.slice(index)]
}

/** Optimistic reorder of one sibling list inside the local tree. */
export function applyLocalReorder(
  tree: LibraryTree,
  kind: NodeKind,
  parentId: string,
  ordered: string[],
): LibraryTree {
  const sorted = <T extends { id: string }>(items: T[]): T[] =>
    [...items].sort((a, b) => ordered.indexOf(a.id) - ordered.indexOf(b.id))

  if (kind === 'group') return { groups: sorted(tree.groups) }
  return {
    groups: tree.groups.map((group) => {
      if (kind === 'repertoire') {
        return group.id === parentId
          ? { ...group, repertoires: sorted(group.repertoires) }
          : group
      }
      return {
        ...group,
        repertoires: group.repertoires.map((rep) => {
          if (kind === 'song') {
            return rep.id === parentId ? { ...rep, songs: sorted(rep.songs) } : rep
          }
          return {
            ...rep,
            songs: rep.songs.map((song) =>
              song.id === parentId ? { ...song, parts: sorted(song.parts) } : song,
            ),
          }
        }),
      }
    }),
  }
}

export function isNodeKind(value: string | undefined): value is NodeKind {
  return (
    value === 'group' ||
    value === 'repertoire' ||
    value === 'song' ||
    value === 'songPart'
  )
}

/** The row a drag handle belongs to, read from its `data-library-*` set. */
export function dragInfoFromHandle(handle: HTMLElement): DragInfo | null {
  const row = handle.closest<HTMLElement>('[data-library-id]')
  if (!row) return null
  const { libraryKind, libraryId, libraryParent } = row.dataset
  if (!isNodeKind(libraryKind) || !libraryId || !libraryParent) return null
  return { kind: libraryKind, id: libraryId, parentId: libraryParent }
}

/** Row under the pointer, restricted to the dragged row's own sibling list. */
export function dropTargetFromPoint(
  root: HTMLElement,
  drag: DragInfo,
  clientY: number,
): DragOver {
  for (const row of root.querySelectorAll<HTMLElement>('[data-library-id]')) {
    if (row.dataset.libraryKind !== drag.kind) continue
    if (row.dataset.libraryParent !== drag.parentId) continue
    const id = row.dataset.libraryId
    if (!id || id === drag.id) continue
    const rect = row.getBoundingClientRect()
    if (clientY < rect.top || clientY > rect.bottom) continue
    return {
      id,
      edge: clientY < rect.top + rect.height / 2 ? 'before' : 'after',
    }
  }
  return null
}

/** Dimming + insertion indicator, matching the track rows. */
export function dragRowClass(
  isDragging: boolean,
  dragOver: 'before' | 'after' | null,
) {
  return cn(
    isDragging && 'opacity-45',
    dragOver === 'before' &&
      'before:pointer-events-none before:absolute before:left-0 before:right-0 before:-top-[0.25rem] before:h-0.5 before:rounded-sm before:bg-ink before:content-[""]',
    dragOver === 'after' &&
      'after:pointer-events-none after:absolute after:bottom-[-0.25rem] after:left-0 after:right-0 after:h-0.5 after:rounded-sm after:bg-ink after:content-[""]',
  )
}

export function songPartLabel(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? ''
  return trimmed || t('library.songPart.unnamed')
}

export function toggleId(set: Set<string>, id: string): Set<string> {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}
