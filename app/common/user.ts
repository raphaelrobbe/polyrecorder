/** Shared auth user shape (root loader / UI). Matches Prisma `User` fields we expose. */
export type User = {
  id: string
  email: string
  /** Required display name (no leading @ in storage). */
  pseudo: string
  /** ISO timestamp of first pseudo customization, or null if still the default. */
  pseudoCustomizedAt: string | null
}

/** Label for account chrome: @pseudo when set. */
export function userDisplayLabel(user: Pick<User, 'email' | 'pseudo'>): string {
  const handle = formatPseudoHandle(user.pseudo)
  return handle ?? user.email
}

/** Public @handle for share / consultation UI. */
export function formatPseudoHandle(
  pseudo: string | null | undefined,
): string | null {
  const trimmed = pseudo?.trim()
  if (!trimmed) return null
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
}
