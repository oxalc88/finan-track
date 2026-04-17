# finan-track

Personal-finance app: a Hono + SQLite backend that ingests encrypted
bank statements, vouchers, and notifications, plus a React/Vite SPA to
browse the results. Designed for a single self-hosted user.

## Stack

| Layer      | Choice                                               |
|------------|------------------------------------------------------|
| API        | [Hono](https://hono.dev) on `@hono/node-server`, Zod validation |
| Database   | SQLite (WAL mode) via `better-sqlite3`, integer centavos |
| Object storage | Cloudflare R2 (presigned URLs) + Google Drive archive |
| LLM        | Vercel AI SDK (Gemini / Groq / xAI / OpenAI-compatible) |
| Frontend   | React 18 + Vite + TanStack Query + Recharts + Tailwind |
| Types      | `@finanzas/shared-types` workspace package (Zod + TS) |

## Layout

```
finan-track/
├── backend/                    Hono API + SQLite repositories + ingestion pipeline
├── frontend/                   React SPA
├── packages/shared-types/      Domain types + Zod schemas shared across both sides
├── docs/                       Plan + architecture notes
├── Dockerfile.api              Prod image for the Hono API
├── Dockerfile.web              Prod image: nginx + built SPA
├── nginx.conf                  SPA fallback + /api proxy
└── docker-compose.prod.yml     Two-service stack (backend + web)
```

## Requirements

- Node.js 20+ (22 recommended)
- **pnpm 10+** — this repo uses the `workspace:*` protocol, which npm
  cannot resolve. `pnpm install` is the supported install path
  (`packageManager` is pinned in `package.json`).

## Getting started

```bash
pnpm install

# Initialise SQLite at backend/db/finanzas.db
pnpm db:migrate
pnpm db:seed

# Two terminals (or use tmux/overmind):
pnpm dev:api    # Hono on http://localhost:3000
pnpm dev:web    # Vite on http://localhost:5173 (proxies /api → :3000)
```

Open <http://localhost:5173> — the dashboard loads against the real
backend.

## Scripts

| Script               | Does                                              |
|----------------------|---------------------------------------------------|
| `pnpm dev:api`       | `tsx watch` the Hono entry point                  |
| `pnpm dev:web`       | Vite dev server on :5173 with `/api` proxy        |
| `pnpm build`         | Build the frontend into `frontend/dist`           |
| `pnpm typecheck`     | `tsc --noEmit` across backend + frontend          |
| `pnpm test`          | Backend Vitest suite (excludes `tests/db/**` — see below) |
| `pnpm test:api`      | Same, explicit                                    |
| `pnpm db:migrate`    | Apply backend SQL migrations to `$DB_PATH`        |
| `pnpm db:seed`       | Seed default financial entities                   |
| `pnpm docker:prod:up`/`down`/`build`/`logs` | Production stack |

`tests/db/**` are excluded from the default test target because they
need a native `better-sqlite3` binding built for the host. Run
`pnpm --filter finanzas-app test:all` if you have that binding.

## API

Hono listens on `PORT` (default `3000`) under `/api/*`:

- `GET /api/health`
- `GET /api/dashboard` — aggregate DTO consumed by the SPA
- `GET|POST /api/entities` · `/accounts` · `/products` · `/categories`
- `GET /api/transactions`
- `GET /api/documents` · `GET /api/documents/:id/url`
- `GET /api/conciliations` + `/matches`, `/discrepancias`,
  `/discrepancias/pending`, `PATCH /discrepancias/:id/resolve|ignore`
- `POST /api/query` — natural-language SQL over SQLite via the LLM
- `POST /api/ingest` — multipart pipeline entrypoint

All inputs are validated with Zod from `@finanzas/shared-types`. A
`ZodError` returns `422 { error: "Validation failed", issues: [...] }`.

## Production

`docker compose -f docker-compose.prod.yml up -d` brings up two
services:

- `backend` — `Dockerfile.api`, the Hono API. SQLite lives on the
  `sqlite_data` named volume at `/data/finanzas.db`.
- `web` — `Dockerfile.web`, `nginx:alpine` serving the built SPA on
  `:80` with `/api/*` reverse-proxied to `backend:3000`.

Required env vars for optional features (R2 / Drive / LLM) are listed
in `docker-compose.prod.yml`; leave blank to disable the corresponding
integration.

## Docs

- `docs/MERGE_PLAN.md` — phased plan that produced the current
  monorepo (all 7 phases shipped).
- `docs/architecture/` — layered-functional conventions inherited from
  the earlier `app-finance` project.
- `backend/CLAUDE.md` — domain-model reference.

## Code style

Functional TypeScript, no classes. Money is stored as integer
centavos; rates as integer basis points. SQL is the interface — no
ORM. Run `pnpm typecheck` + `pnpm test` before pushing.
