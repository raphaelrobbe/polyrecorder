/* App-shell service worker: cache HTML + static assets so the installed
   PWA can open offline for local recording. API / auth / uploads stay online. */
const CACHE = 'polyrecorder-shell-v1'

const PRECACHE_URLS = ['/', '/site.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch(() => undefined),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function shouldBypass(url) {
  const path = url.pathname
  return (
    path.startsWith('/api') ||
    path.startsWith('/auth') ||
    path.startsWith('/json') ||
    path.startsWith('/__')
  )
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/fonts/') ||
    /\.(?:js|css|woff2?|ttf|png|svg|webp|ico|webmanifest)$/i.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return
  if (shouldBypass(url)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            void caches.open(CACHE).then((cache) => {
              void cache.put(request, copy.clone())
              // Always keep a fresh shell at `/` for offline app launch.
              if (url.pathname === '/' || url.pathname === '') {
                void cache.put('/', copy)
              }
            })
          }
          return response
        })
        .catch(async () => {
          const cache = await caches.open(CACHE)
          return (
            (await cache.match(request)) ||
            (await cache.match('/')) ||
            new Response('Offline', {
              status: 503,
              statusText: 'Offline',
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          )
        }),
    )
    return
  }

  if (!isStaticAsset(url)) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      const network = fetch(request)
        .then((response) => {
          if (response.ok) void cache.put(request, response.clone())
          return response
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
