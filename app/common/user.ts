/** Shared auth user shape (root loader / UI). Matches Prisma `User` fields we expose. */
export type User = {
  id: string
  email: string
  /** Optional display name; falls back to email in the UI. */
  pseudo: string | null
}

/** Label for account chrome: pseudo if set, otherwise email. */
export function userDisplayLabel(user: Pick<User, 'email' | 'pseudo'>): string {
  const pseudo = user.pseudo?.trim()
  return pseudo && pseudo.length > 0 ? pseudo : user.email
}
