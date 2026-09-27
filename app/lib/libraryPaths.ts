/** Build library / portfolio URLs (no leading @ in the path). */
export function libraryUserPath(pseudo: string): string {
  const cleaned = pseudo.trim().replace(/^@+/, '')
  return `/${encodeURIComponent(cleaned)}`
}

export function libraryGroupPath(groupId: string): string {
  return `/groupe/${encodeURIComponent(groupId)}`
}

export function libraryRepertoirePath(repertoireId: string): string {
  return `/repertoire/${encodeURIComponent(repertoireId)}`
}

export function librarySongPath(songId: string): string {
  return `/chanson/${encodeURIComponent(songId)}`
}

export function librarySessionPath(songPartId: string): string {
  return `/session/${encodeURIComponent(songPartId)}`
}

export type LibraryBreadcrumbSegment = {
  label: string
  to: string | null
}

export function normalizePathPseudo(raw: string): string {
  return decodeURIComponent(raw).trim().replace(/^@+/, '')
}
