import type { LoaderFunctionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { getUserFromRequest } from '~/service/auth.server'
import { libraryUserPath } from '~/lib/libraryPaths'

/** Legacy `/u/*` → `/:pseudo` (strip leading @). */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const splat = String(params['*'] ?? '')
    .trim()
    .replace(/^@+/, '')
  if (splat) {
    return redirect(libraryUserPath(splat.split('/')[0]!), 301)
  }
  const user = await getUserFromRequest(request)
  if (!user) return redirect('/connexion')
  return redirect(libraryUserPath(user.pseudo))
}

export default function URedirect() {
  return null
}
