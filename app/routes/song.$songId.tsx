import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData, useParams } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { DeckMain } from '~/components/DeckMain'
import { RecorderApp } from '~/components/RecorderApp'
import { useLocale } from '~/hooks/useLocale'
import { t, tp } from '~/lib/i18n'
import { loadCloudSongIntoSession } from '~/lib/sessionActions.client'
import { getSongShareMeta } from '~/service/cloud.server'
import { getAppUrl } from '~/service/env.server'
import { useSessionStore } from '~/store/sessionStore'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const songId = String(params.songId ?? '')
  const result = await getSongShareMeta(request, songId)
  if (!result.ok) {
    throw json(
      { ok: false as const, reason: result.reason },
      { status: result.reason === 'not_found' ? 404 : 400 },
    )
  }
  const appUrl = getAppUrl()
  const canonical = `${appUrl}/song/${result.song.id}`
  const ogImage = `${appUrl}/og/song/${result.song.id}.svg`
  return json({
    ok: true as const,
    isOwner: result.isOwner,
    song: result.song,
    canonical,
    ogImage,
  })
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !('ok' in data) || !data.ok) {
    return [
      { title: `PolyRecorder — ${t('song.view.notFound')}` },
      { name: 'robots', content: 'noindex' },
    ]
  }
  const tracksLabel = tp(
    'library.count.track.one',
    'library.count.track.other',
    data.song.trackCount,
  )
  const description = t('song.og.description', { tracks: tracksLabel })
  const title = `${data.song.name} · PolyRecorder`
  if (!data.song.isPublic && data.isOwner) {
    return [
      { title },
      { name: 'robots', content: 'noindex' },
      { property: 'og:title', content: data.song.name },
      { property: 'og:description', content: description },
    ]
  }
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:type', content: 'music.song' },
    { property: 'og:site_name', content: 'PolyRecorder' },
    { property: 'og:url', content: data.canonical },
    { property: 'og:title', content: data.song.name },
    { property: 'og:description', content: description },
    { property: 'og:image', content: data.ogImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: data.song.name },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: data.ogImage },
  ]
}

function SongViewClient({ songId }: { songId: string }) {
  useLocale()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const setError = useSessionStore((s) => s.setError)

  useEffect(() => {
    let cancelled = false
    void loadCloudSongIntoSession(songId).then((ok) => {
      if (cancelled) return
      if (!ok) {
        setStatus('error')
        setError(t('song.view.notFound'))
        return
      }
      setStatus('ready')
    })
    return () => {
      cancelled = true
    }
  }, [songId, setError])

  if (status === 'loading') {
    return (
      <p className="m-0 py-10 text-center text-[0.95rem] text-ink-soft">
        {t('library.opening')}
      </p>
    )
  }
  if (status === 'error') {
    return (
      <p className="m-0 py-10 text-center text-[0.95rem] text-ink-soft">
        {t('song.view.notFound')}
      </p>
    )
  }
  return <DeckMain />
}

export default function SongRoute() {
  const data = useLoaderData<typeof loader>()
  const params = useParams()
  const songId = data.ok ? data.song.id : String(params.songId ?? '')

  return (
    <ClientOnly
      fallback={
        <main className="flex min-h-[50vh] w-[min(440px,100%)] flex-col items-center justify-center gap-3 animate-rise text-ink-soft">
          <p className="m-0 text-[0.9rem] font-semibold">PolyRecorder</p>
        </main>
      }
    >
      {() => (
        <RecorderApp>
          <SongViewClient songId={songId} />
        </RecorderApp>
      )}
    </ClientOnly>
  )
}
