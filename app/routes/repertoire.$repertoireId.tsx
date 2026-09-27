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
import { songMetaLabel } from '~/lib/libraryCounts'
import {
  libraryGroupPath,
  librarySongPath,
  libraryUserPath,
} from '~/lib/libraryPaths'
import { t } from '~/lib/i18n'
import { getLibraryRepertoireLevel } from '~/service/cloud.server'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const repertoireId = String(params.repertoireId ?? '')
  const result = await getLibraryRepertoireLevel(request, repertoireId)
  if (!result.ok) {
    throw json(
      { ok: false as const, reason: result.reason },
      { status: result.reason === 'not_found' ? 404 : 400 },
    )
  }
  return json(result)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !('ok' in data) || !data.ok) {
    return [
      { title: `PolyRecorder — ${t('library.title')}` },
      { name: 'robots', content: 'noindex' },
    ]
  }
  return [
    { title: `${data.repertoire.name} · PolyRecorder` },
    { name: 'robots', content: data.isOwner ? 'noindex' : 'index' },
  ]
}

function RepertoireClient() {
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
          to: libraryGroupPath(data.group.id),
        },
        {
          label: data.repertoire.name,
        },
      ]}
      levelTitle={t('library.level.songs')}
      items={data.songs.map((song) => ({
        id: song.id,
        title: song.name,
        meta: songMetaLabel(song.partCount),
        to: librarySongPath(song.id),
      }))}
      emptyLabel={t('library.empty.songs')}
      canEdit={data.isOwner}
      itemKind="song"
      reorderParentId={data.repertoire.id}
      addLabel={t('library.addSong')}
      onCreate={
        data.isOwner
          ? async () => {
              const name = window.prompt(
                t('library.namePrompt'),
                t('library.addSong'),
              )
              if (name == null) return null
              const trimmed = name.trim()
              if (!trimmed) return null
              const result = await postLibrary({
                intent: 'createSong',
                repertoireId: data.repertoire.id,
                name: trimmed,
              })
              if (!result.ok || !result.id) {
                throw new Error('create failed')
              }
              return librarySongPath(result.id)
            }
          : undefined
      }
    />
  )
}

export default function RepertoireRoute() {
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
        {() => <RepertoireClient />}
      </ClientOnly>
    </AppShell>
  )
}
