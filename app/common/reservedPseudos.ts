/**
 * Top-level path segments that must not be claimed as user pseudos.
 * Keep in sync when adding a new single-segment Remix route.
 */
export const RESERVED_PSEUDOS = [
  'aide',
  'api',
  'auth',
  'bibliotheque',
  'chanson',
  'compte',
  'connexion',
  'groupe',
  'groupes',
  'legal',
  'og',
  'parametres',
  'privacy',
  'repertoire',
  'session',
  'sitemap',
  'song',
  'terms',
  'u',
] as const

const RESERVED_SET = new Set(
  RESERVED_PSEUDOS.map((s) => s.toLowerCase()),
)

export function isReservedPseudo(pseudo: string): boolean {
  return RESERVED_SET.has(pseudo.trim().toLowerCase())
}
