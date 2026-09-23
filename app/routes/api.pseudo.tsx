import type { LoaderFunctionArgs } from '@remix-run/node'
import { data } from '@remix-run/node'
import {
  getUserFromRequest,
  isPseudoAvailable,
  normalizePseudo,
  parsePseudoInput,
} from '~/service/auth.server'

/**
 * Live pseudo availability check (auth required).
 * Query: `?pseudo=…` — checks from 3 characters upward.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return data(
      { available: false as const, reason: 'unauthorized' as const, pseudo: '' },
      { status: 401 },
    )
  }

  const raw = new URL(request.url).searchParams.get('pseudo') ?? ''
  const normalized = normalizePseudo(raw)

  if (normalized.length === 0) {
    return {
      available: true as const,
      reason: 'empty' as const,
      pseudo: '',
    }
  }

  const parsed = parsePseudoInput(normalized)
  if (!parsed.ok) {
    return {
      available: false as const,
      reason: parsed.reason,
      pseudo: normalized,
    }
  }

  // Same as current (case-insensitive) → fine.
  if (
    user.pseudo &&
    parsed.pseudo &&
    user.pseudo.toLowerCase() === parsed.pseudo.toLowerCase()
  ) {
    return {
      available: true as const,
      reason: 'unchanged' as const,
      pseudo: parsed.pseudo,
    }
  }

  const available = await isPseudoAvailable(parsed.pseudo!, user.id)
  return {
    available,
    reason: available ? ('ok' as const) : ('taken' as const),
    pseudo: parsed.pseudo!,
  }
}
