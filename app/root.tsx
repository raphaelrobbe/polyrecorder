import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node'
import {
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
import { getAppUrl } from '~/service/env.server'
import stylesheet from '~/tailwind.css?url'

export const links: LinksFunction = () => {
  const base = import.meta.env.BASE_URL
  return [
    { rel: 'stylesheet', href: stylesheet },
    {
      rel: 'icon',
      href: `${base}favicon.ico`,
      sizes: '48x48',
    },
    {
      rel: 'icon',
      href: `${base}favicon.svg`,
      type: 'image/svg+xml',
    },
    {
      rel: 'icon',
      href: `${base}favicon-32.png`,
      type: 'image/png',
      sizes: '32x32',
    },
    {
      rel: 'icon',
      href: `${base}favicon-16.png`,
      type: 'image/png',
      sizes: '16x16',
    },
    {
      rel: 'apple-touch-icon',
      href: `${base}apple-touch-icon.png?v=3`,
      sizes: '180x180',
    },
    { rel: 'manifest', href: `${base}site.webmanifest?v=3` },
  ]
}

/** Cookie session → authenticated user, or null for guests. */
export async function loader({ request }: LoaderFunctionArgs) {
  const appUrl = getAppUrl()
  try {
    const user = await getUserFromRequest(request)
    return { user, appUrl }
  } catch (error) {
    console.error('[root] loader failed', error)
    return { user: null, appUrl }
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="polyrecorder" />
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
    void import('~/lib/pwaInstallCapture.client').then((mod) => {
      mod.initPwaInstallCapture()
    })
    if (!('serviceWorker' in navigator)) return
    const base = import.meta.env.BASE_URL || '/'
    const swUrl = new URL('sw.js', window.location.origin + base).pathname
    void navigator.serviceWorker.register(swUrl).catch((error) => {
      console.warn('[pwa] service worker registration failed', error)
    })
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

  useEffect(() => {
    console.error('[ErrorBoundary]', error)
  }, [error])

  const title = t('error.title')
  const lead = t('error.lead')
  const home = t('error.home')

  return (
    <main className="mx-auto flex w-[min(440px,100%)] flex-col gap-5 px-4 py-10 animate-rise">
      <h1 className="font-display m-0 text-[1.6rem] font-bold tracking-[-0.02em] text-ink">
        {title}
      </h1>
      <p className="m-0 text-[0.95rem] leading-[1.45] text-ink-soft">{lead}</p>
      <p className="m-0">
        <a href="/" className="text-ink underline-offset-2 hover:underline">
          {home}
        </a>
      </p>
    </main>
  )
}
