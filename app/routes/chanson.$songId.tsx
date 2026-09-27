import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData, useRevalidator } from '@remix-run/react'
import { useState } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { AppShell } from '~/components/AppShell'
import {
  LibraryBrowseView,
  postLibrary,
} from '~/components/library/LibraryBrowseView'
import { SongOwnerToolbar } from '~/components/library/SongOwnerToolbar'
import OverlayShortcuts from '~/components/OverlayShortcuts.client'
import { useLocale } from '~/hooks/useLocale'
import {
  libraryGroupPath,
  libraryRepertoirePath,
  librarySessionPath,
  libraryUserPath,
} from '~/lib/libraryPaths'
import { t } from '~/lib/i18n'
import { getLibrarySongLevel } from '~/service/cloud.server'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const songId = String(params.songId ?? '')
  const result = await getLibrarySongLevel(request, songId)
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
    { title: `${data.song.name} · PolyRecorder` },
    {
      name: 'robots',
      content: data.isOwner || !data.song.isPublic ? 'noindex' : 'index',
    },
  ]
}

function ChansonClient() {
  useLocale()
  const data = useLoaderData<typeof loader>()
  const revalidator = useRevalidator()
  const [error, setError] = useState<string | null>(null)
  if (!data.ok) return null

  const shareSongPartId = data.parts[0]?.id ?? null

  return (
    <>
      {error ? (
        <p className="m-0 mb-2 text-center text-[0.82rem] font-semibold text-ink-soft">
          {error}
        </p>
      ) : null}
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
          to: libraryRepertoirePath(data.repertoire.id),
        },
        {
          label: data.song.name,
        },
      ]}
      levelTitle={t('library.level.songParts')}
      headerActions={
        data.isOwner ? (
          <SongOwnerToolbar
            songId={data.song.id}
            songName={data.song.name}
            isPublic={data.song.isPublic}
            allowsCollaboration={data.song.allowsCollaboration}
            shareSongPartId={shareSongPartId}
            onChanged={() => revalidator.revalidate()}
            onError={() => setError(t('library.error'))}
          />
        ) : undefined
      }
      items={data.parts.map((part) => ({
        id: part.id,
        title: part.name?.trim() ?? '',
        titlePlaceholder: t('library.songPart.unnamed'),
        allowEmptyTitle: true,
        trackNames: part.trackNames,
        durationMs: part.durationMs,
        to: librarySessionPath(part.id),
        share: {
          songPartId: part.id,
          songName: data.song.name,
          isPublic: data.song.isPublic,
        },
      }))}
      emptyLabel={t('library.empty.songParts')}
      canEdit={data.isOwner}
      itemKind="songPart"
      reorderParentId={data.song.id}
      addLabel={t('library.addSongPart')}
      onCreate={
        data.isOwner
          ? async () => {
              const name = window.prompt(
                t('library.namePrompt'),
                t('library.addSongPart'),
              )
              if (name == null) return null
              const trimmed = name.trim()
              const result = await postLibrary({
                intent: 'createSongPart',
                songId: data.song.id,
                name: trimmed === t('library.addSongPart') ? '' : trimmed,
              })
              if (!result.ok || !result.id) {
                throw new Error('create failed')
              }
              return librarySessionPath(result.id)
            }
          : undefined
      }
    />
    </>
  )
}

export default function ChansonRoute() {
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
        {() => <ChansonClient />}
      </ClientOnly>
    </AppShell>
  )
}
