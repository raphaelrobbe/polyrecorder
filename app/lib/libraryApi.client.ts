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
  }
}
