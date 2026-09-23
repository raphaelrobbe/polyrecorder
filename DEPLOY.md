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
| `DATABASE_URL` | Postgres URL (`sslmode=no-verify`) — used by CI `prisma migrate deploy` |

Optional variable: `SCW_REGION` (default `fr-par`).

Image tags pushed: `polyrecorder:latest` and `polyrecorder:<sha>`. Point the Scaleway container at `…/polyrecorder:latest`.

CI steps: `bun run ts` → `prisma generate` → `prisma migrate deploy` → Docker build/push → container redeploy.

### Container env (Scaleway)

Set on the Serverless Container (same values as local `.env`, prod-oriented):

| Env | Notes |
|-----|--------|
| `DATABASE_URL` | Same as the GitHub secret |
| `SESSION_SECRET` | Long random string (required in prod) |
| `APP_URL` | Public HTTPS origin, e.g. `https://polyrecorder.app` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` | Scaleway TEM (`From` is hardcoded to `noreply@polyrecorder.app`) |
| `SMTP_PASS` | Optional — if unset, uses `SCW_SECRET_KEY` |
| `SCW_SECRET_KEY` | Optional on the container — TEM password fallback (same value as the deploy secret) |

## Database (Postgres + Prisma)

### Local

```bash
docker compose up -d
cp .env.example .env   # if needed
# DATABASE_URL=postgresql://polyrecorder:polyrecorder@127.0.0.1:5434/polyrecorder?schema=public
```

Port **5434** (avoids clash with other local Postgres, e.g. E-RIC on 5433). Image: Postgres **17** (align with Scaleway).

### Scaleway (prod)

1. Console → **Managed Databases** → Create PostgreSQL (region `fr-par`, v16 if available).
2. Create a DB user + database `polyrecorder` (or use the default DB and set the name in the URL).
3. Allow the **Serverless Containers** / app IP (or “allow Scaleway IPs” / VPC as you prefer).
4. Connection string with `sslmode=no-verify` → secret `DATABASE_URL` (GitHub + container env).
   (`no-verify` encrypts without failing on Scaleway’s private CA; do not omit SSL entirely.)

Do **not** commit real credentials. Use `.env` locally and Scaleway / GitHub secrets in prod.

### Prisma

```bash
bun run db:migrate    # local: create/apply migrations
bun run db:deploy     # prod: apply existing migrations
bun run db:studio     # browse data
```

Schema: `User`, `MagicLink`, `Session` (opaque hashed tokens). Client: `app/service/db.server.ts`.
