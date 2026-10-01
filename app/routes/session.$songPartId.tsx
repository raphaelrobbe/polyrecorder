import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Link, useLoaderData, useParams } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { BrandWordmark } from '~/components/Brand'
import { Deck } from '~/components/Deck'
import { DeckMain } from '~/components/DeckMain'
import { JsonLd } from '~/components/JsonLd'
import { RecorderApp } from '~/components/RecorderApp'
import { useLocale } from '~/hooks/useLocale'
import { t, tp } from '~/lib/i18n'
import { libraryUserPath } from '~/lib/libraryPaths'
import { brandLogoUrl, pageMeta } from '~/lib/seo'
import {
  clearLocalDeckSession,
  loadCloudSongIntoSession,
  resumeAfterNetworkOnline,
} from '~/lib/sessionActions.client'
import { getSongShareMeta } from '~/service/cloud.server'
import { getAppUrl } from '~/service/env.server'
import { useSessionStore } from '~/store/sessionStore'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const songPartId = String(params.songPartId ?? '')
  const result = await getSongShareMeta(request, songPartId)
  if (!result.ok) {
    throw json(
      { ok: false as const, reason: result.reason },
      { status: result.reason === 'not_found' ? 404 : 400 },
    )
  }
  const appUrl = getAppUrl()
  const canonical = `${appUrl}/session/${result.song.id}`
  const logo = brandLogoUrl(appUrl)
  return json({
    ok: true as const,
    isOwner: result.isOwner,
    song: result.song,
    canonical,
    logo,
  })
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !('ok' in data) || !data.ok) {
    return [
      { title: `polyrecorder — ${t('song.view.notFound')}` },
      { name: 'robots', content: 'noindex' },
    ]
  }
  const tracksLabel = tp(
    'library.count.track.one',
    'library.count.track.other',
    data.song.trackCount,
  )
  const description = t('song.og.description', { tracks: tracksLabel })
  const title = `${data.song.name} · polyrecorder`
  if (!data.song.isPublic && data.isOwner) {
    return pageMeta({
      title,
      description,
      robots: 'noindex',
    })
  }
  return pageMeta({
    title,
    description,
    url: data.canonical,
    image: data.logo,
    type: 'music.song',
  })
}

function SessionViewClient({ songPartId }: { songPartId: string }) {
  useLocale()
  const deckSongPartId = useSessionStore((s) => s.deckSongPartId)
  const storeError = useSessionStore((s) => s.error)
  const alreadyReady = deckSongPartId === songPartId
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    alreadyReady ? 'ready' : 'loading',
  )
  const setError = useSessionStore((s) => s.setError)

  useEffect(() => {
    let cancelled = false
    // Always refetch so library mutations (public, collab, …) show up when
    // re-opening; keep the current deck visible if this session is already loaded.
    if (useSessionStore.getState().deckSongPartId !== songPartId) {
      setStatus('loading')
    }
    void loadCloudSongIntoSession(songPartId)
      .then((ok) => {
        if (cancelled) return
        if (!ok) {
          setStatus('error')
          const offline =
            typeof navigator !== 'undefined' && navigator.onLine === false
          setError(
            offline ? t('cloud.error.openOffline') : t('song.view.notFound'),
          )
          return
        }
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
        const offline =
          typeof navigator !== 'undefined' && navigator.onLine === false
        setError(
          offline ? t('cloud.error.openOffline') : t('cloud.error.openFailed'),
        )
      })
    return () => {
      cancelled = true
    }
  }, [songPartId, setError])

  // Meta applied mid-flight → show the deck (tracks may still be downloading).
  useEffect(() => {
    if (deckSongPartId === songPartId && status === 'loading') {
      setStatus('ready')
    }
  }, [deckSongPartId, songPartId, status])

  // Back online after a failed open (or empty deck): reload this session.
  useEffect(() => {
    const onOnline = () => {
      setStatus((prev) => (prev === 'error' ? 'loading' : prev))
      void resumeAfterNetworkOnline({ songPartId }).then((ok) => {
        if (!ok) {
          setStatus((prev) => (prev === 'loading' ? 'error' : prev))
          return
        }
        setStatus('ready')
        setError(null)
      })
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [songPartId, setError])

  if (status === 'loading') {
    return (
      <Deck>
        <p className="m-0 py-10 text-center text-[0.95rem] text-ink-soft">
          {t('library.opening')}
        </p>
      </Deck>
    )
  }
  if (status === 'error') {
    return (
      <Deck>
        <div className="flex flex-col items-center gap-[0.85rem] py-10 text-center">
          <p className="m-0 text-[0.95rem] text-ink-soft">
            {storeError ?? t('song.view.notFound')}
          </p>
          <Link
            to="/"
            reloadDocument
            className="text-[0.9rem] font-semibold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
            onClick={() => {
              clearLocalDeckSession()
              setError(null)
            }}
          >
            {t('song.view.newSession')}
          </Link>
        </div>
      </Deck>
    )
  }

  return <DeckMain />
}

export default function SessionRoute() {
  const data = useLoaderData<typeof loader>()
  const params = useParams()
  const songPartId = data.ok ? data.song.id : String(params.songPartId ?? '')
  const tracksLabel =
    data.ok
      ? tp(
          'library.count.track.one',
          'library.count.track.other',
          data.song.trackCount,
        )
      : ''
  const description = data.ok
    ? t('song.og.description', { tracks: tracksLabel })
    : ''

  return (
    <>
      {data.ok && data.song.isPublic ? (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'MusicRecording',
            name: data.song.name,
            url: data.canonical,
            description,
            byArtist: {
              '@type': 'Person',
              name: data.song.ownerPseudo,
              url: `${new URL(data.canonical).origin}${libraryUserPath(data.song.ownerPseudo)}`,
            },
            image: data.logo,
            isAccessibleForFree: true,
          }}
        />
      ) : null}
      <ClientOnly
        fallback={
          <main className="flex min-h-[50vh] w-[min(440px,100%)] flex-col items-center justify-center gap-3 animate-rise text-ink-soft">
            <p className="m-0 text-[1.1rem]">
              <BrandWordmark />
            </p>
          </main>
        }
      >
        {() => (
          <RecorderApp>
            {data.ok ? (
              <SessionViewClient songPartId={songPartId} />
            ) : (
              <Deck>
                <p className="m-0 py-10 text-center text-[0.95rem] text-ink-soft">
                  {t('song.view.notFound')}
                </p>
              </Deck>
            )}
          </RecorderApp>
        )}
      </ClientOnly>
    </>
  )
}
