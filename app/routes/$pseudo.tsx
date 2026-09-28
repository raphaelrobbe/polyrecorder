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
import { isReservedPseudo } from '~/common/reservedPseudos'
import { useLocale } from '~/hooks/useLocale'
import { groupMetaLabel } from '~/lib/libraryCounts'
import {
  libraryGroupPath,
  libraryUserPath,
  normalizePathPseudo,
} from '~/lib/libraryPaths'
import { t } from '~/lib/i18n'
import { absoluteUrl, appUrlFromMatches, brandLogoUrl, pageMeta } from '~/lib/seo'
import { getLibraryPortfolio } from '~/service/cloud.server'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const pseudo = normalizePathPseudo(String(params.pseudo ?? ''))
  if (!pseudo || isReservedPseudo(pseudo)) {
    throw json({ ok: false as const, reason: 'not_found' }, { status: 404 })
  }
  const result = await getLibraryPortfolio(request, pseudo)
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
  const title = `@${data.pseudo} · polyrecorder`
  const description = t('seo.library.user.description', { pseudo: data.pseudo })
  const indexable = !data.isOwner
  return pageMeta({
    title,
    description,
    url:
      indexable && appUrl
        ? absoluteUrl(appUrl, libraryUserPath(data.pseudo))
        : undefined,
    image: appUrl ? brandLogoUrl(appUrl) : undefined,
    robots: indexable ? 'index' : 'noindex',
  })
}

export function shouldRevalidate() {
  return true
}

function PortfolioClient() {
  useLocale()
  const data = useLoaderData<typeof loader>()

  if (!data.ok) return null

  const items = data.tree.groups.map((group) => {
    const songCount = group.repertoires.reduce(
      (sum, rep) => sum + rep.songs.length,
      0,
    )
    return {
      id: group.id,
      title: group.name,
      meta: groupMetaLabel(group.repertoires.length, songCount),
      to: libraryGroupPath(group.id),
    }
  })

  return (
    <LibraryBrowseView
      breadcrumb={[
        {
          label: data.pseudo,
          isPseudo: true,
        },
      ]}
      levelTitle={t('library.level.groups')}
      items={items}
      emptyLabel={t('library.empty')}
      canEdit={data.isOwner}
      itemKind="group"
      reorderParentId="__root__"
      addLabel={t('library.addGroup')}
      onCreate={
        data.isOwner
          ? async () => {
              const name = window.prompt(
                t('library.namePrompt'),
                t('library.addGroup'),
              )
              if (name == null) return null
              const trimmed = name.trim()
              if (!trimmed) return null
              const result = await postLibrary({
                intent: 'createGroup',
                name: trimmed,
              })
              if (!result.ok || !result.id) {
                throw new Error('create failed')
              }
              return libraryGroupPath(result.id)
            }
          : undefined
      }
    />
  )
}

export default function PseudoPortfolioRoute() {
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
        {() => <PortfolioClient />}
      </ClientOnly>
    </AppShell>
  )
}
