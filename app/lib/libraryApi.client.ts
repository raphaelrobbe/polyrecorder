import type { LibraryTree } from './libraryTree'

/** Client helper for `/api/cloud/library` mutations. */
export async function postLibrary(body: Record<string, unknown>) {
  const res = await fetch('/api/cloud/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await res.json()) as {
    ok: boolean
    reason?: string
    id?: string
    /** Present when `intent: 'createSong'` succeeds. */
    defaultPartId?: string
    name?: string | null
  }
}

/** Fetch the signed-in user’s library tree. */
export async function fetchLibraryTree(): Promise<LibraryTree | null> {
  const res = await fetch('/api/cloud/library')
  const data = (await res.json()) as {
    ok: boolean
    tree?: LibraryTree
  }
  if (!data.ok || !data.tree) return null
  return data.tree
}
