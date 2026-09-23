import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react'
import type { User } from '~/common/user'
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

/** Stub auth seam — later: cookie/JWT → user | null. */
export async function loader(_args: LoaderFunctionArgs) {
  return { user: null as User | null }
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
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
  return (
    <div id="root">
      <Outlet />
    </div>
  )
}
