import { vitePlugin as remix } from '@remix-run/dev'
import { installGlobals } from '@remix-run/node'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

installGlobals()

declare module '@remix-run/node' {
  interface Future {
    v3_singleFetch: true
  }
}

/** Chrome DevTools / CDP probes hit the Vite port by mistake — answer quietly. */
function silenceDevtoolsProbes(): Plugin {
  return {
    name: 'silence-devtools-probes',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0] ?? ''
        if (path === '/json' || path.startsWith('/json/')) {
          res.statusCode = 204
          res.end()
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    silenceDevtoolsProbes(),
    remix({
      future: {
        v3_lazyRouteDiscovery: true,
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_singleFetch: true,
        v3_throwAbortReason: true,
      },
    }),
    tailwindcss(),
    tsconfigPaths(),
  ],
  // Pre-bundle heavy audio deps so first lazy use does not trigger a Vite
  // "optimized dependencies changed" full reload (wipes guest in-memory deck).
  optimizeDeps: {
    include: ['@breezystack/lamejs', '@soundtouchjs/audio-worklet'],
  },
})
