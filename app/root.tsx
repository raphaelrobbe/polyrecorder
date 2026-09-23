import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from '@remix-run/react'
import { useEffect } from 'react'
import { initLocale } from '~/hooks/useLocale'
import { t } from '~/lib/i18n'
import { getUserFromRequest } from '~/service/auth.server'
import stylesheet from '~/tailwind.css?url'

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  {
    rel: 'icon',
    href: `${import.meta.env.BASE_URL}favicon.svg`,
    type: 'image/svg+xml',
  },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Manrope:wght@400;500;600;700&display=swap',
  },
]

/** Cookie session → authenticated user, or null for guests. */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await getUserFromRequest(request)
    return { user }
  } catch (error) {
    console.error('[root] loader failed', error)
    return { user: null }
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const pref=localStorage.getItem('polyrecorder-theme');const dark=pref==='dark'||(pref!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);document.documentElement.classList.toggle('light',!dark);document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.style.colorScheme=dark?'dark':'light'}catch(_){}try{const stored=localStorage.getItem('polyrecorder-locale');const known=new Set(['fr','en','de','no']);const aliases={nb:'no',nn:'no'};let locale=stored&&known.has(stored)?stored:null;if(!locale){const langs=navigator.languages?.length?navigator.languages:[navigator.language];for(const raw of langs){const tag=String(raw||'').toLowerCase();const primary=tag.split('-')[0]||tag;if(known.has(primary)){locale=primary;break}if(aliases[primary]){locale=aliases[primary];break}}}document.documentElement.lang=locale||'en'}catch(_){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  useEffect(() => {
    initLocale()
  }, [])

  return (
    <div id="root">
      <Outlet />
    </div>
  )
}

/** Catch route/render failures so the user never sees a blank Application Error. */
export function ErrorBoundary() {
  const error = useRouteError()
  const title = t('error.title')
  const lead = t('error.lead')
  const home = t('error.home')

  let detail: string | null = null
  if (isRouteErrorResponse(error)) {
    detail = `${error.status} ${error.statusText}`
  } else if (error instanceof Error && process.env.NODE_ENV !== 'production') {
    detail = error.message
  }

  return (
    <main className="mx-auto flex w-[min(440px,100%)] flex-col gap-5 px-4 py-10 animate-rise">
      <h1 className="font-display m-0 text-[1.6rem] font-bold tracking-[-0.02em] text-ink">
        {title}
      </h1>
      <p className="m-0 text-[0.95rem] leading-[1.45] text-ink-soft">{lead}</p>
      {detail ? (
        <p className="m-0 text-[0.85rem] font-medium text-ink-soft" role="status">
          {detail}
        </p>
      ) : null}
      <p className="m-0">
        <a href="/" className="text-ink underline-offset-2 hover:underline">
          {home}
        </a>
      </p>
    </main>
  )
}
