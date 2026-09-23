# Deploy note (branch `refacto-remix`)

PolyRecorder now uses **Remix SSR** (`bun run build` → `bun run start` with `remix-serve`).

GitHub Pages cannot host SSR. The Pages workflow on `main` remains for the legacy SPA until this branch is merged and Scaleway is the production host.

## Local

```bash
bun install
bun run dev      # remix vite:dev — http://localhost:5173/
bun run build
bun run start    # serves ./build/server/index.js
```

Served at `/` (routes `/`, `/parametres`, `/aide`).

## Docker (Scaleway)

```bash
docker build -t polyrecorder .
# if bun install hangs in Docker:
docker build --network=host -t polyrecorder .
docker run --rm -p 8080:8080 -e PORT=8080 polyrecorder
# → http://localhost:8080/
```

The image builds with Bun and runs with Node (React 19 + Bun breaks `react-dom/server`). `remix-serve` listens on `PORT` (default `8080`; Scaleway overrides it).

### GitHub Actions → Scaleway

Workflow: [`.github/workflows/deploy-scaleway.yml`](.github/workflows/deploy-scaleway.yml) (push on `refacto-remix` or manual dispatch).

Repo secrets:

| Secret | Role |
|--------|------|
| `SCW_DOCKER_REGISTRY` | Registry host, e.g. `rg.fr-par.scw.cloud/<namespace>` |
| `SCW_SECRET_KEY` | Scaleway API / registry password (`nologin`) |
| `SCW_CONTAINER_ID` | Serverless Container UUID to redeploy (optional until the container exists) |

Optional variable: `SCW_REGION` (default `fr-par`).

Image tags pushed: `polyrecorder:latest` and `polyrecorder:<sha>`. Point the Scaleway container at `…/polyrecorder:latest`.
