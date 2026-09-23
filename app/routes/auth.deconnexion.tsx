import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { revokeSessionFromRequest } from '~/service/auth.server'
import { redirectClearingSession } from '~/service/session.server'

export async function loader({ request }: LoaderFunctionArgs) {
  await revokeSessionFromRequest(request)
  return redirectClearingSession('/', request)
}

export async function action({ request }: ActionFunctionArgs) {
  await revokeSessionFromRequest(request)
  return redirectClearingSession('/', request)
}
