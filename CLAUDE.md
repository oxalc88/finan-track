# CLAUDE.md

Root guidance for Claude Code in this repository. Domain-specific
rules for the backend live in [`backend/CLAUDE.md`](backend/CLAUDE.md).

## Context

**finan-track** is a single-user, self-hosted personal-finance app.
The repo is a pnpm monorepo: `backend/` (Hono + SQLite), `frontend/`
(React + Vite SPA), `packages/shared-types/` (Zod schemas + types
shared across both sides). The phased merge that produced this
layout is described in [`docs/MERGE_PLAN.md`](docs/MERGE_PLAN.md);
all 7 phases have shipped.

## Conventions

- **Functional TypeScript.** Plain functions, closures, composition.
  No classes anywhere — not in the backend, not in the frontend.
- **Wire validation.** Every POST/PUT/PATCH body is parsed with a
  Zod schema from `@finanzas/shared-types`. A thrown `ZodError`
  becomes `422 { error: "Validation failed", issues: [...] }`.
- **Money.** Integer centavos in the DB and on ingestion-side
  routes; the `/api/dashboard` adapter is the only place that
  converts to decimal for the frontend.
- **Spanish-in, English-out (dashboard only).** Backend columns and
  enums are uppercase Spanish (`AHORRO`, `CORRIENTE`, `TELEGRAM`).
  `/api/dashboard` translates to English field names; every other
  route returns raw Spanish rows, and the frontend mirrors those
  shapes locally in `frontend/src/types/domain.ts`.
- **Timestamps** are ISO 8601 UTC in SQLite; formatted to `es-PE`
  only for display.
- **IDs** are ULIDs.
- **Package manager:** pnpm (the repo uses `workspace:*` which npm
  cannot resolve; `packageManager` is pinned in `package.json`).

## When working here

- Read `docs/MERGE_PLAN.md` for current status.
- New routes: copy the shape of an existing one — thin handler,
  `schema.parse`, delegate to a repository.
- New adapter logic: add a pure function in
  `backend/src/api/adapters/` with a mocked-repository Vitest in
  `backend/tests/api/adapters/`.
- Run `pnpm typecheck && pnpm test` before committing. The
  `tests/db/**` suite is excluded by default because it needs a
  `better-sqlite3` native binding that may not be present; use
  `pnpm --filter finanzas-app test:all` to include it.

## Don't

- Don't reintroduce classes, ORMs, or HTTP client libraries. Use
  `fetch` directly and raw SQL via `better-sqlite3`.
- Don't hardcode currency or locale on the frontend. The default
  is `PEN` via `formatCurrency` in `frontend/src/lib/formatters.ts`.
- Don't reintroduce the dropped Fastify stack (`postgres`,
  `minio`, `rabbitmq`, `redis`). Those belong to the pre-merge era
  and have been removed from the codebase.
