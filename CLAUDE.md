# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this
repository. Keep changes functional, small, and pragmatic.

## What this project is

**finan-track** is a personal-finance app for a single self-hosted
user. Encrypted bank statements, vouchers, and Telegram/email
notifications are ingested, normalised, categorised, and reconciled;
the result is served by a Hono API and rendered by a React SPA.

The repo is a pnpm monorepo combining two predecessor projects:

- `backend/` — the Hono + SQLite stack from *app-finance*.
- `frontend/` — the React/Vite UI from the original *finan-track*.
- `packages/shared-types/` — domain types + Zod schemas consumed by
  both sides.

See [`docs/MERGE_PLAN.md`](docs/MERGE_PLAN.md) for the phase-by-phase
merge that produced this layout (all 7 phases are shipped).

## Stack

- **Runtime:** Node.js 22, TypeScript, functional style (no classes)
- **API:** Hono on `@hono/node-server`, Zod validation via
  `@finanzas/shared-types`
- **DB:** SQLite (WAL) via `better-sqlite3`, integer centavos for
  money, integer basis points for rates, no ORM
- **Storage:** Cloudflare R2 (presigned URLs) + Google Drive archive
- **LLM:** Vercel AI SDK (Gemini / Groq / xAI / OpenAI-compatible)
- **Frontend:** React 18 + Vite + TanStack Query + Recharts + Tailwind
- **Package manager:** pnpm 10 (the repo uses `workspace:*` which npm
  cannot resolve — `packageManager` is pinned in `package.json`)

## Layout

```
finan-track/
├── backend/                      Hono API, SQLite repositories, ingestion pipeline
│   ├── src/
│   │   ├── api/
│   │   │   ├── index.ts          Server entry
│   │   │   ├── middleware/       Zod 422 + error handler
│   │   │   ├── routes/           One file per top-level resource
│   │   │   └── adapters/         Centavos→decimal / enum maps / dashboard DTO
│   │   ├── db/
│   │   │   ├── connection.ts     SQLite factory
│   │   │   ├── schema.ts         Migration runner
│   │   │   ├── migrations/       Numbered .sql files
│   │   │   ├── seed.ts           Default entities
│   │   │   └── repositories/     Data access layer (functions, no classes)
│   │   ├── domain/               types.ts, invariants.ts, events.ts
│   │   ├── ingestion/            OCR/LLM pipeline
│   │   ├── query/                NL → SQL translator + guard + executor
│   │   └── storage/              R2 + Drive clients
│   └── tests/                    Vitest (db/* tests need a native binding)
├── frontend/                     React SPA (pages/, components/, hooks/, lib/, types/)
├── packages/shared-types/        Zod schemas + inferred TS types
├── docs/                         MERGE_PLAN.md + legacy architecture notes
├── Dockerfile.api / Dockerfile.web
├── nginx.conf
└── docker-compose.prod.yml
```

## Commands

```bash
pnpm install                  # pnpm only; npm cannot resolve workspace:*
pnpm db:migrate && pnpm db:seed
pnpm dev:api                  # Hono on :3000
pnpm dev:web                  # Vite on :5173 with /api proxied to :3000
pnpm typecheck                # tsc --noEmit across backend + frontend
pnpm test                     # backend Vitest (excludes tests/db/**)
pnpm build                    # frontend production build
pnpm docker:prod:up           # production two-service stack
```

## Conventions

- **Functional style.** Plain functions, closures, composition. Never
  introduce classes. Repositories are named exports: `findAll`,
  `findById`, `create`, `update`, `deactivate`, etc.
- **Validation at the wire.** Every POST/PUT/PATCH body is parsed
  with a Zod schema from `@finanzas/shared-types`. ZodErrors surface
  as `422 { error: "Validation failed", issues: [...] }`.
- **Money.** Integers in centavos in the DB and across the wire on
  ingestion-side routes. The dashboard adapter converts to decimal
  for the frontend (see `backend/src/api/adapters/money.ts`).
- **Spanish-in, English-out (for dashboard).** Backend DB columns
  and enums are in Spanish (uppercase: `AHORRO`, `CORRIENTE`,
  `TELEGRAM`, etc.). The `/api/dashboard` adapter translates to
  English field names matching the frontend's `DashboardData` DTO.
  Other routes currently return raw Spanish rows; the frontend
  defines local mirror types in `frontend/src/types/domain.ts`.
- **Timestamps.** ISO 8601 UTC in SQLite. Format to `es-PE` on the
  frontend for display.
- **IDs.** ULIDs, chronologically sortable.

## When working in this repo

- Read `docs/MERGE_PLAN.md` first for current status.
- For new routes, copy the shape of an existing one (thin handler,
  `schema.parse`, delegates to a repository).
- For new adapter logic, add a pure function to
  `backend/src/api/adapters/` and a mocked-repository Vitest to
  `backend/tests/api/adapters/`.
- Run `pnpm typecheck && pnpm test` before committing; pre-existing
  `tests/db/**` failures are caused by a missing native binding and
  are excluded from the default target.

## Do / Don't

**Do**

- Keep functions small, single-purpose, and imported directly — no
  DI container.
- Extend `@finanzas/shared-types` whenever a new request shape or
  DTO crosses the wire.
- Prefer editing existing files to creating new ones.

**Don't**

- Don't add classes, ORMs, or HTTP clients — use `fetch` directly
  and raw SQL via `better-sqlite3`.
- Don't hardcode currency or locale on the frontend — default is
  `PEN` via `formatCurrency` in `frontend/src/lib/formatters.ts`.
- Don't reintroduce the dropped Fastify stack (`postgres`, `minio`,
  `rabbitmq`, `redis`). Those belong to the pre-merge era.
