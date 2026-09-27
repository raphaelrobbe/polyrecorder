export type LibrarySongPart = {
  id: string
  name: string | null
  trackNames: string[]
  masterVolume: number
  lastOpenedAt: string
  updatedAt: string
}

export type LibrarySong = {
  id: string
  name: string
  isPublic: boolean
  allowsCollaboration: boolean
  lastOpenedAt: string
  updatedAt: string
  parts: LibrarySongPart[]
}

export type LibraryRepertoire = {
  id: string
  name: string
  songs: LibrarySong[]
}

export type LibraryGroup = {
  id: string
  name: string
  repertoires: LibraryRepertoire[]
}

export type LibraryTree = {
  groups: LibraryGroup[]
}

export type LibraryPath = {
  pseudo: string
  group?: LibraryGroup
  repertoire?: LibraryRepertoire
  song?: LibrarySong
}

export function findPathByGroupId(
  tree: LibraryTree,
  groupId: string,
): LibraryPath | null {
  const group = tree.groups.find((g) => g.id === groupId)
  if (!group) return null
  return { pseudo: '', group }
}

export function findPathByRepertoireId(
  tree: LibraryTree,
  repertoireId: string,
): LibraryPath | null {
  for (const group of tree.groups) {
    const repertoire = group.repertoires.find((r) => r.id === repertoireId)
    if (repertoire) return { pseudo: '', group, repertoire }
  }
  return null
}

export function findPathBySongId(
  tree: LibraryTree,
  songId: string,
): LibraryPath | null {
  for (const group of tree.groups) {
    for (const repertoire of group.repertoires) {
      const song = repertoire.songs.find((s) => s.id === songId)
      if (song) return { pseudo: '', group, repertoire, song }
    }
  }
  return null
}

export function findPathBySongPartId(
  tree: LibraryTree,
  songPartId: string,
): LibraryPath | null {
  for (const group of tree.groups) {
    for (const repertoire of group.repertoires) {
      for (const song of repertoire.songs) {
        if (song.parts.some((p) => p.id === songPartId)) {
          return { pseudo: '', group, repertoire, song }
        }
      }
    }
  }
  return null
}
