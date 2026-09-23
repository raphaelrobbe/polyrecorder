# Deploy note (branch `refacto-remix`)

PolyRecorder now uses **Remix SSR** (`bun run build` → `bun run start` with `remix-serve`).

GitHub Pages cannot host SSR. The Pages workflow on `main` remains for the legacy SPA until this branch is merged and a Bun host (e.g. Scaleway container, like E-RIC) is wired.

Local:

```bash
bun install
bun run dev      # remix vite:dev — http://localhost:5173/polyrecorder/
bun run build
bun run start    # serves ./build/server/index.js
```

Basename: `/polyrecorder/`.
