import type { LoaderFunctionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { getUserFromRequest } from '~/service/auth.server'
import { libraryUserPath } from '~/lib/libraryPaths'

/** Legacy `/groupes` → `/:pseudo` when signed in. */
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromRequest(request)
  if (!user) return redirect('/connexion')
  return redirect(libraryUserPath(user.pseudo))
}

export default function GroupesRedirect() {
  return null
}
