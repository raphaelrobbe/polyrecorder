import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { ClientOnly } from 'remix-utils/client-only'
import { AppShell } from '~/components/AppShell'
import {
  LibraryBrowseView,
  postLibrary,
} from '~/components/library/LibraryBrowseView'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { useLocale } from '~/hooks/useLocale'
import { repertoireMetaLabel } from '~/lib/libraryCounts'
import {
  libraryGroupPath,
  libraryRepertoirePath,
  libraryUserPath,
} from '~/lib/libraryPaths'
import { t } from '~/lib/i18n'
import { absoluteUrl, appUrlFromMatches, brandLogoUrl, pageMeta } from '~/lib/seo'
import { getLibraryGroupLevel } from '~/service/cloud.server'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const groupId = String(params.groupId ?? '')
  const result = await getLibraryGroupLevel(request, groupId)
  if (!result.ok) {
    throw json(
      { ok: false as const, reason: result.reason },
      { status: result.reason === 'not_found' ? 404 : 400 },
    )
  }
  return json(result)
}

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  if (!data || !('ok' in data) || !data.ok) {
    return [
      { title: `polyrecorder — ${t('library.title')}` },
      { name: 'robots', content: 'noindex' },
    ]
  }
  const appUrl = appUrlFromMatches(matches)
  const title = `${data.group.name} · polyrecorder`
  const description = t('seo.library.group.description', {
    name: data.group.name,
  })
  const indexable = !data.isOwner
  return pageMeta({
    title,
    description,
    url:
      indexable && appUrl
        ? absoluteUrl(appUrl, libraryGroupPath(data.group.id))
        : undefined,
    image: appUrl ? brandLogoUrl(appUrl) : undefined,
    robots: indexable ? 'index' : 'noindex',
  })
}

function GroupClient() {
  useLocale()
  const data = useLoaderData<typeof loader>()
  if (!data.ok) return null

  return (
    <LibraryBrowseView
      breadcrumb={[
        {
          label: data.ownerPseudo,
          to: libraryUserPath(data.ownerPseudo),
          isPseudo: true,
        },
        {
          label: data.group.name,
        },
      ]}
      levelTitle={t('library.level.repertoires')}
      items={data.repertoires.map((rep) => ({
        id: rep.id,
        title: rep.name,
        meta: repertoireMetaLabel(rep.songCount),
        to: libraryRepertoirePath(rep.id),
      }))}
      emptyLabel={t('library.empty.repertoires')}
      canEdit={data.isOwner}
      itemKind="repertoire"
      reorderParentId={data.group.id}
      addLabel={t('library.addRepertoire')}
      onCreate={
        data.isOwner
          ? async () => {
              const name = window.prompt(
                t('library.namePrompt'),
                t('library.addRepertoire'),
              )
              if (name == null) return null
              const trimmed = name.trim()
              if (!trimmed) return null
              const result = await postLibrary({
                intent: 'createRepertoire',
                groupId: data.group.id,
                name: trimmed,
              })
              if (!result.ok || !result.id) {
                throw new Error('create failed')
              }
              return libraryRepertoirePath(result.id)
            }
          : undefined
      }
    />
  )
}

export default function GroupeRoute() {
  return (
    <AppShell wide>
      <ClientOnly fallback={null}>{() => <OverlayShortcuts />}</ClientOnly>
      <ClientOnly
        fallback={
          <p className="m-0 py-8 text-center text-[0.9rem] text-ink-soft">
            …
          </p>
        }
      >
        {() => <GroupClient />}
      </ClientOnly>
    </AppShell>
  )
}
