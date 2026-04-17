# Plan — Merge finan-track Frontend with app-finance Backend

## Progress

- **Phase 1** — Scaffolding — done on
  `claude/continue-open-issue-dVLv7` (monorepo, shared-types package,
  workspace wiring).
- **Phase 2** — Zod validation middleware — done on
  `claude/continue-open-issue-dVLv7` (PR #4) and covered by 35
  behaviour-focused tests on
  `claude/phase-2-tests-phase-3-start-t5HUb`. Middleware fix: Hono's
  compose swallows route-handler throws at dispatch level, so the
  wrapper reads `c.error` after `next()`; `errorHandler` now returns
  the 422 shape directly for `ZodError`.
- **Phase 3** — Backend adapter + `GET /api/dashboard` — done on
  `claude/phase-2-tests-phase-3-start-t5HUb`. New files:
  `backend/src/api/adapters/{money,enums,dashboard}.ts`,
  `backend/src/api/routes/dashboard.ts`; registered in
  `backend/src/api/index.ts`.
- **Phase 4** — Frontend API client — done on
  `claude/phase-2-tests-phase-3-start-t5HUb`. `frontend/src/lib/api.ts`
  replaces the mock stub with thin `fetch` wrappers
  (`fetchDashboardData`, documents, conciliations, discrepancias,
  `postQuery`). `formatCurrency` now defaults to `PEN`/`es-PE`.
  Pre-existing pages that reference dropped `Investment`/`Debt`/
  `Notification` fields still fail to typecheck — those are Phase 6
  cleanup scope.
- **Phase 5+** — not started. Pick up from the "Phase 5 — New Pages"
  section below.

---

## Context

Two parallel personal-finance projects exist:

- **app-finance** (`/Users/lannister/projects/oxDeveloop/app-finance`) — a working backend: Hono on port 3000, SQLite (WAL mode), 41 REST endpoints, LLM-powered document ingestion (Telegram/email/Drive), reconciliation engine, SUNAT tax deductibility logic, natural-language query interface. Has only a static HTML dashboard, no real frontend.

- **finan-track** (`/Users/lannister/projects/oxDeveloop/finan-track`, branch `claude/merge-frontend-backend-main-xsVDY`) — a polished React 18 + Vite + TanStack Query + Recharts frontend with 8 pages and a full component library. But its `lib/api.ts` is a stub that returns mock data, and its Fastify backend is unused.

**Goal:** Combine them into a single deployable app — app-finance's working backend + finan-track's React frontend — without adding new infrastructure (no new DB, no microservices, no SSR). Keep it simple enough for a single-user self-hosted VPS.

**What this change addresses:**
- App-finance has a weak UI (static HTML). Finan-track has a strong UI but nothing behind it. Merging gives both sides their missing half.
- Prevents maintaining two parallel codebases for the same domain.
- Surfaces app-finance's unique features (document pipeline, reconciliation, NL query) in a proper UI.

**Scope cuts (to keep it simple):**
- Drop Investments, Debts, and Notifications pages — no corresponding backend, not worth building now.
- Keep single-user architecture, keep SQLite, keep centavos-integer money model.
- Pure client-side SPA (no SSR), nginx in front of Hono.

---

## Architecture Decisions

| Decision | Choice |
|---|---|
| Monorepo host | **finan-track repo** (already on GitHub at `oxalc88/finan-track`). app-finance has no git remote, so we migrate its code into finan-track on a new branch. |
| Branch strategy | New branch `claude/merge-with-app-finance-backend` off `main`. Main stays docs-only until this lands. |
| Monorepo layout | `backend/` (from app-finance) + `frontend/` (from finan-track) + `packages/shared-types/` |
| Type sharing | Shared workspace package `@finanzas/shared-types` imported by both sides, with **Zod schemas** for boundary validation. TS types for internal domain; Zod schemas for anything crossing the wire (POST bodies, LLM-extracted fields, query inputs). `z.infer<>` keeps TS types and runtime validation in sync from one source. |
| Dashboard API shape | Single aggregate `GET /api/dashboard` endpoint |
| Translation layer (centavos→decimal, Spanish→English) | Backend adapter in `backend/src/api/adapters/` |
| Production serving | nginx serves `frontend/dist/`, proxies `/api/*` to Hono :3000 |
| Dev ports | Vite :5173, Hono :3000, proxy `/api` → `localhost:3000` |

### Repo Layout After Migration

```
finan-track/                    (GitHub repo, new branch)
├── backend/                    ← copied from finan-track/backend/src/ + db/ + package.json
│   ├── src/
│   ├── db/
│   └── package.json
├── frontend/                   ← already exists from finan-track branch
│   └── package.json
├── packages/
│   └── shared-types/           ← NEW
│       ├── src/
│       │   ├── domain.ts       ← pure TS types: Account, Transaction, etc.
│       │   ├── api.ts          ← pure TS types: DashboardData, DocumentPipelineRow, etc.
│       │   ├── schemas/        ← Zod schemas for wire boundaries
│       │   │   ├── ingest.ts   ← IngestRequestSchema (multipart fields)
│       │   │   ├── query.ts    ← QueryRequestSchema (NL question)
│       │   │   ├── category.ts ← CreateCategorySchema, MergeCategoriesSchema
│       │   │   ├── entities.ts ← CreateEntitySchema, UpdateEntitySchema
│       │   │   └── index.ts
│       │   └── index.ts        ← re-exports domain + api + schemas
│       └── package.json        ← depends on `zod`
├── package.json                ← root workspaces config
└── docs/                       ← existing architecture docs
```

Both `backend` and `frontend` import from `@finanzas/shared-types` via workspace link. Types live in one place, generated DTOs match.

**Zod usage pattern:**
- Define a schema once: `export const CreateCategorySchema = z.object({ nombre: z.string().min(1), es_deducible_sunat: z.boolean() })`
- Export the inferred type: `export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>`
- Backend validates at the route: `const body = CreateCategorySchema.parse(await c.req.json())`
- Frontend uses the inferred type for form state and request body typing
- One source of truth — can never drift between server validation and client types

---

## Phase 1 — Scaffolding (in finan-track repo)

**Goal:** Set up the finan-track repo as a monorepo containing both app-finance's backend and the React frontend, with a shared types package. Commit early so progress is on GitHub for mobile continuation.

1. In finan-track, create and push new branch: `git checkout -b claude/merge-with-app-finance-backend origin/claude/merge-frontend-backend-main-xsVDY` (branches off the most complete branch so we keep the working frontend).
2. Copy `/Users/lannister/projects/oxDeveloop/app-finance/` contents into `finan-track/backend/`:
   - Copy `src/`, `db/`, `examples/`, `n8n-workflows/`, `tsconfig.json`, `biome.json`, `knip.json`, `mise.toml`, `Dockerfile`, `package.json`, `CLAUDE.md`
   - Skip: `node_modules/`, `.git/`, `.env`, the old finan-track `backend/` directory (which has Fastify code we're discarding)
3. Delete the existing `finan-track/backend/` (Fastify stub) before the copy, OR copy app-finance into a fresh `backend/` dir.
4. Create `packages/shared-types/` workspace:
   - `packages/shared-types/package.json` — name `@finanzas/shared-types`, exports `./src/index.ts`, depends on `zod` (^3 or latest)
   - `packages/shared-types/src/domain.ts` — move `Account`, `CreditCard`, `CashFlowData`, `ExpenseCategory` from `frontend/src/types/index.ts` (skip `Investment`, `Debt`, `Notification` — dropped in Phase 5)
   - `packages/shared-types/src/api.ts` — move `DashboardData` + add `DocumentPipelineRow`, `ConciliationRow`, `DiscrepancyRow`, `QueryResult`
   - `packages/shared-types/src/schemas/` — Zod schemas for boundaries:
     - `ingest.ts` — `IngestRequestSchema` (canal, entidad_id, producto_id, password)
     - `query.ts` — `QueryRequestSchema` (`question: z.string().min(1).max(500)`)
     - `category.ts` — `CreateCategorySchema`, `MergeCategoriesSchema` (`source_id`, `target_id`)
     - `entities.ts` — `CreateEntitySchema`, `UpdateEntitySchema`
     - `index.ts` — re-export; each file also exports `z.infer<>` types
   - `packages/shared-types/src/index.ts` — re-export domain + api + schemas
5. Edit root `finan-track/package.json`:
   - Add `"workspaces": ["backend", "frontend", "packages/*"]`
   - Add scripts: `"dev:api": "npm run dev -w backend"`, `"dev:web": "npm run dev -w frontend"`, `"build:web": "npm run build -w frontend"`, `"build:types": "npm run build -w packages/shared-types"`
6. Edit `frontend/package.json`: add dependency `"@finanzas/shared-types": "workspace:*"`; rename package to `"finanzas-frontend"`.
7. Edit `backend/package.json`: add dependency `"@finanzas/shared-types": "workspace:*"`; ensure `dev` script is `tsx watch src/api/index.ts`.
8. Edit `frontend/vite.config.ts`: port `5173`, proxy `target: 'http://localhost:3000'`.
9. Edit `frontend/src/types/index.ts`: replace local types with `export * from '@finanzas/shared-types'`.
10. **Commit and push** early — this gets the skeleton onto GitHub so mobile continuation can proceed. Atomic commits: one for monorepo scaffolding, one for backend migration, one for shared-types extraction.

**Verify:** `npm install` at repo root succeeds. `npm run dev:api` runs Hono on :3000. `npm run dev:web` runs Vite on :5173. Browser at :5173 loads the mock-data UI (still using stub API before Phase 3).

---

## Phase 2 — Wire Zod validation into backend routes

**Goal:** Replace ad-hoc request validation with Zod schemas from `@finanzas/shared-types`.

**Edit existing routes** (keep scope narrow — only routes that accept input):
- `backend/src/api/routes/ingest.ts` — parse multipart with `IngestRequestSchema`
- `backend/src/api/routes/query.ts` — `QueryRequestSchema.parse(body)` before calling LLM
- `backend/src/api/routes/categories.ts` — `CreateCategorySchema` on POST, `MergeCategoriesSchema` on POST `/merge`
- `backend/src/api/routes/entities.ts` — `CreateEntitySchema` / `UpdateEntitySchema`
- `backend/src/api/routes/accounts.ts` and `products.ts` — analogous create/update schemas (add schemas in Phase 1 as needed)

**Error handling:** Catch `ZodError` in a Hono middleware; return `422` with the issue list. One middleware in `backend/src/api/middleware/validation.ts`.

**Verify:** Send invalid payload (empty `nombre`, too-long `question`) — returns 422 with field errors, not a 500 or silent success.

---

## Phase 3 — Backend Adapter + Dashboard Endpoint

**Goal:** Emit a DTO that matches finan-track's `DashboardData` type exactly.

**New files:**
- `finan-track/backend/src/api/adapters/money.ts` — `centavosToDecimal(n)`, `basisPointsToPercent(bp)`
- `finan-track/backend/src/api/adapters/enums.ts` — Spanish → English enum maps (`AHORRO|CTS|PLAZO_FIJO` → `'savings'`, `CORRIENTE` → `'checking'`)
- `finan-track/backend/src/api/adapters/dashboard.ts` — composes the DashboardData DTO. Reuses existing repositories:
  - `src/db/repositories/accounts.ts::findAll`
  - `src/db/repositories/products.ts::findAll`
  - `src/db/repositories/analytics.ts::spendByCategory`, `monthlyTrend`, `pipelineStatus`
  - Computes `creditCards[].utilizationPercentage` from latest `resumen_estado_cuenta`
  - Computes `overview.changes` deltas from current vs prior-month `monthlyTrend` (return `0` if sparse)
- `finan-track/backend/src/api/routes/dashboard.ts` — `GET /` route, calls adapter, returns JSON

**Edit:** `finan-track/backend/src/api/index.ts` — register `app.route("/api/dashboard", createDashboardRoutes(db))`.

**Verify:** With seeded DB, `curl localhost:3000/api/dashboard` returns JSON matching `DashboardData` (English field names, decimal money).

---

## Phase 4 — Frontend API Client

**Goal:** Replace the stub with real HTTP.

**Rewrite** `finan-track/frontend/src/lib/api.ts`:
- `fetchDashboardData()` → `fetch('/api/dashboard')`
- Add: `fetchDocuments(filter?)`, `fetchDocumentUrl(id)`, `fetchConciliations()`, `fetchConciliationMatches(id)`, `fetchConciliationDiscrepancias(id)`, `fetchDiscrepanciasPending()`, `resolveDiscrepancia(id, resolucion)`, `ignoreDiscrepancia(id)`, `postQuery(question)`
- All thin `fetch` wrappers — no axios, no client.

**Edit** `finan-track/frontend/src/lib/formatters.ts`:
- `formatCurrency(amount, currency = 'USD')` → default to `'PEN'`

**New file** `finan-track/frontend/src/types/domain.ts`:
- `DocumentPipelineRow`, `ConciliationRow`, `DiscrepancyRow`, `QueryResult`

**Verify:** Dashboard page (`/`) loads with real data from the seeded DB. Empty DB renders zeros without crashing.

---

## Phase 5 — New Pages (Documents, Conciliations, Query)

**Goal:** Surface app-finance's unique features.

**Documents** (`/documents`)
- New: `frontend/src/pages/DocumentsPage.tsx` — table from `fetchDocuments()`
- New: `frontend/src/components/DocumentsTable.tsx` — columns: `recibido_en`, `canal`, `tipo`, `entidad`, `estado` (badge), action "Open" → `fetchDocumentUrl(id)` → `window.open`
- New: `frontend/src/hooks/useDocuments.ts` — TanStack Query wrapper

**Conciliations** (`/conciliations`)
- New: `frontend/src/pages/ConciliationsPage.tsx` — two-panel (list + detail)
- New: `frontend/src/components/ConciliationDetail.tsx` — matches + discrepancies with Resolve/Ignore buttons
- New: `frontend/src/hooks/useConciliations.ts`, `useConciliationDetail.ts`

**Query** (`/query`)
- New: `frontend/src/pages/QueryPage.tsx` — textarea + "Ask" button, calls `postQuery()`
- New: `frontend/src/components/QueryResult.tsx` — renders `answer`, collapsible `sql`, optional `data[]` table

**Edit** `finan-track/frontend/src/App.tsx` — add routes `/documents`, `/conciliations`, `/query`.

**Add navigation** — `frontend/src/components/SideNav.tsx` (desktop sidebar) + update `MobileHeader` with: Dashboard, Accounts, Credit Cards, Cash Flow, Documents, Conciliations, Query.

**Verify:** `/documents` lists rows; "Open" opens presigned URL. `/conciliations` shows list + detail; Resolve/Ignore refetches. `/query` returns LLM answer for a Spanish question.

---

## Phase 6 — Cleanup (Drop Investments, Debts, Notifications)

**Goal:** Remove pages with no backend.

**Delete files:**
- `frontend/src/pages/InvestmentsPage.tsx`
- `frontend/src/pages/DebtPage.tsx`
- `frontend/src/pages/NotificationsPage.tsx`
- `frontend/src/components/InvestmentsSummary.tsx`
- `frontend/src/components/DebtOverview.tsx`
- `frontend/src/components/NotificationsAlerts.tsx`

**Edit:**
- `frontend/src/App.tsx` — remove imports and routes for all three
- `frontend/src/pages/DashboardHome.tsx` — remove `<InvestmentsSummary>`, `<DebtOverview>`, `<NotificationsAlerts>` sections and imports; promote `<CreditCardTracker>` to full width
- `frontend/src/pages/Dashboard.tsx` — same as above (consider deleting if redundant with `DashboardHome`)
- `frontend/src/components/OverviewCards.tsx` — drop `Total Investments` card; keep or repurpose `Total Debt`; reduce grid to `lg:grid-cols-3`
- `frontend/src/components/MobileDashboard.tsx` — drop investments/debts/notifications sections
- `frontend/src/types/index.ts` — delete `Investment`, `Debt`, `Notification` types; drop `investments`, `debts`, `notifications` fields from `DashboardData`
- `finan-track/backend/src/api/adapters/dashboard.ts` — don't produce `investments`, `debts`, `notifications` fields

**Verify:** `npm run typecheck -w frontend` passes. Nav has no dead links.

---

## Phase 7 — Production Deployment (nginx + Hono)

**Goal:** Single VPS deploy with nginx serving static files and proxying API.

**Edits:**
- `finan-track/package.json` — add `"build": "npm run build -w frontend"`
- `finan-track/Dockerfile` — two-stage build: stage 1 builds frontend (`node:20`, `npm ci && npm run build -w frontend`), stage 2 is the Hono API runtime, copy `frontend/dist` into the nginx container's volume
- `finan-track/docker-compose.yml` — add `nginx` service (alpine), volume-mount `frontend/dist` read-only, publish `:80`, depends on `api`
- New: `finan-track/nginx.conf` — adapt from `/Users/lannister/projects/oxDeveloop/finan-track/frontend/nginx.conf`:
  - `root /usr/share/nginx/html;`
  - `try_files $uri $uri/ /index.html;` (SPA fallback)
  - `location /api/ { proxy_pass http://api:3000; }`
  - Keep gzip settings from source

**Verify:**
- `npm run build` produces `frontend/dist/`
- `docker compose up` serves app on `:80`
- All routes load against real DB, no console errors
- Currency shows `S/` (PEN) by default
- Network tab shows only `/api/dashboard` + route-specific calls (no N+1)

---

## End-to-End Verification Checklist

1. Fresh `npm install` at repo root
2. `npm run db:migrate && npm run db:seed`
3. Dev: `npm run dev:api` + `npm run dev:web` → visit `http://localhost:5173`
4. Every route loads cleanly:
   - `/` → real totals, credit cards, cash flow chart
   - `/accounts` → deposit accounts
   - `/credit-cards` → credit products with utilization %
   - `/cash-flow` → monthly trend + category pie
   - `/documents` → rows listed, "Open" opens presigned URL
   - `/conciliations` → list + detail; Resolve/Ignore mutates and refetches
   - `/query` → Spanish question returns answer
5. Prod: `npm run build && docker compose up` → repeat checks at `http://localhost`
6. Currency shows `S/` by default
7. Network tab: clean (no zoo of fetches)

---

## Critical Files

**Backend (new):**
- `finan-track/backend/src/api/adapters/money.ts`
- `finan-track/backend/src/api/adapters/enums.ts`
- `finan-track/backend/src/api/adapters/dashboard.ts`
- `finan-track/backend/src/api/routes/dashboard.ts`

**Backend (edit):**
- `finan-track/backend/src/api/index.ts` — register dashboard route
- `finan-track/package.json` — workspaces + scripts
- `finan-track/Dockerfile`, `docker-compose.yml`
- `finan-track/nginx.conf` (new)

**Frontend (new):**
- `frontend/src/pages/DocumentsPage.tsx`
- `frontend/src/pages/ConciliationsPage.tsx`
- `frontend/src/pages/QueryPage.tsx`
- `frontend/src/components/DocumentsTable.tsx`
- `frontend/src/components/ConciliationDetail.tsx`
- `frontend/src/components/QueryResult.tsx`
- `frontend/src/components/SideNav.tsx`
- `frontend/src/hooks/useDocuments.ts`, `useConciliations.ts`, `useConciliationDetail.ts`
- `frontend/src/types/domain.ts`

**Frontend (rewrite/edit):**
- `frontend/src/lib/api.ts` — replace stub with real fetches
- `frontend/src/lib/formatters.ts` — default currency to PEN
- `frontend/src/App.tsx` — add new routes, remove old ones
- `frontend/src/pages/DashboardHome.tsx` — remove dropped sections
- `frontend/src/components/OverviewCards.tsx` — adjust grid + cards
- `frontend/src/components/MobileDashboard.tsx` — remove dropped sections
- `frontend/src/types/index.ts` — prune types for dropped features
- `frontend/vite.config.ts` — port + proxy target
- `frontend/package.json` — rename

**Frontend (delete):**
- `pages/InvestmentsPage.tsx`, `pages/DebtPage.tsx`, `pages/NotificationsPage.tsx`
- `components/InvestmentsSummary.tsx`, `components/DebtOverview.tsx`, `components/NotificationsAlerts.tsx`
