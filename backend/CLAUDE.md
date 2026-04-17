# FinanzasApp

Personal finance application for ingesting, normalizing, categorizing, and analyzing financial documents from multiple channels. Built for a single user (self-hosted) with a lean stack on a modest VPS.

## What this project does

Solves the problem of having financial data scattered across encrypted bank statements, photos of receipts, electronic invoices, and email notifications — with no unified way to query, reconcile, or leverage it for tax deductions.

**Four utilities, built incrementally:**

1. **Ingesta & Normalization** — Receive documents via Telegram, email (IMAP), Google Drive. Extract data (OCR/LLM), normalize transactions, auto-categorize, persist to SQLite.
2. **Query & Visibility** — Dashboard + conversational queries via messaging gateway skills. Read-only over SQLite.
3. **Bank Reconciliation** — Cross-reference consumption notifications vs. bank statements vs. vouchers/invoices. Detect discrepancies.
4. **SUNAT Reconciliation** — Cross-reference expenses vs. SUNAT deductible expense list to maximize personal income tax credit (Peruvian tax system).

Build order: 1 → 2 → 3 → 4.

## Architecture

```
VPS (4 vCPU, 4-8GB RAM, 75-105GB NVMe) — accessed via Tailscale

Processes:
  n8n (port 5678)           — orchestrator for all workflows
  Messaging gateway (18789) — conversational query interface (read-only)
  Query API (port 3000)     — Hono/Bun HTTP server for dashboard + API

Data:
  SQLite (WAL mode)         — source of truth, transactional store
  DuckDB (optional)         — analytical queries via sqlite_scanner, add only if needed

Object storage:
  Cloudflare R2             — hot storage, presigned URLs for dashboard (<180 days)
  Google Drive              — permanent archive (dual-write from day 0)

External:
  LLM API (vision-capable)  — extraction, categorization, query translation
  Telegram Bot API          — ingesta channel
  Gmail IMAP                — ingesta channel
  Google Drive API          — ingesta channel (batch) + archive
  SUNAT                     — reference data (annual)
```

## Tech stack

- **Runtime:** Node.js / Bun (TypeScript)
- **API server:** Hono
- **Database:** SQLite via better-sqlite3 (WAL mode)
- **Object storage:** @aws-sdk/client-s3 (R2 is S3-compatible)
- **Orchestration:** n8n (workflows, not code)
- **Dashboard:** Single HTML file, React + Tailwind via CDN
- **IDs:** ULIDs (chronologically sortable)

## Code style

- **Functional.** No classes. Use plain functions, closures, composition.
- **Simple implementations.** Prefer the obvious approach over clever abstractions.
- **TypeScript.** Strict mode. Define types for all domain entities.
- **Errors:** Fail fast. Collect all validation errors before returning. Never swallow errors silently.
- **No ORMs.** Use better-sqlite3 directly with prepared statements. SQL is the interface.
- **Money:** Integer centavos (S/42.50 = 4250). Never floating point.
- **Rates:** Integer basis points (5.5% = 550).
- **Timestamps:** ISO 8601 UTC in SQLite. Convert to America/Lima for display only.

## Project structure

```
finanzas-app/
├── CLAUDE.md                          # This file
├── analysis/
│   └── domain-model/                  # Domain model documentation
│       ├── bounded-contexts.md
│       ├── entities-aggregates.md
│       ├── invariants.md
│       ├── domain-events.md
│       ├── lifecycle.md
│       ├── architecture.md
│       └── data-model.md
├── src/
│   ├── db/
│   │   ├── schema.ts                  # Table definitions, migration runner
│   │   ├── migrations/                # Numbered SQL migration files
│   │   │   └── 001_initial_schema.sql
│   │   ├── connection.ts              # SQLite connection factory
│   │   └── seed.ts                    # Default financial entities
│   ├── domain/
│   │   ├── types.ts                   # All domain types (entities, value objects, enums)
│   │   ├── invariants.ts              # Validation functions for business rules
│   │   └── events.ts                  # Domain event type definitions
│   ├── storage/
│   │   ├── r2.ts                      # R2 upload, delete, presigned URL generation
│   │   └── drive.ts                   # Google Drive upload (via googleapis)
│   ├── api/
│   │   ├── index.ts                   # Hono server entry point
│   │   ├── routes/
│   │   │   ├── entities.ts            # CRUD for financial entities
│   │   │   ├── accounts.ts            # CRUD for deposit accounts
│   │   │   ├── products.ts            # CRUD for credit products
│   │   │   ├── categories.ts          # CRUD + merge for categories
│   │   │   ├── transactions.ts        # List, filter, analytical queries
│   │   │   ├── documents.ts           # Pipeline status, presigned URLs
│   │   │   ├── conciliations.ts       # Conciliation results + discrepancies
│   │   │   └── summary.ts            # Aggregated analytics endpoints
│   │   └── middleware/
│   │       └── error-handler.ts
│   ├── dashboard/
│   │   └── index.html                 # Static SPA
│   └── skills/                        # Messaging gateway skill definitions
│       ├── query-expenses.ts
│       ├── query-balance.ts
│       └── query-debt.ts
├── n8n-workflows/                     # Exported n8n workflow JSONs
│   └── README.md                      # Instructions for importing
├── package.json
├── tsconfig.json
└── .env.example
```

## Database schema

See `analysis/domain-model/data-model.md` for the complete schema with all tables, indexes, constraints, and invariant enforcement mapping.

Key tables: `entidad_financiera`, `cuenta_deposito`, `producto_credito`, `categoria`, `documento_fuente`, `transaccion`, `resumen_estado_cuenta`, `lote`, `conciliacion`, `match_conciliacion`, `discrepancia`.

## Domain model reference

The `analysis/domain-model/` directory contains the complete domain model. Read these files to understand the business domain:

- **bounded-contexts.md** — 5 bounded contexts, their responsibilities, and relationships
- **entities-aggregates.md** — All entities with semantic types, aggregate roots, value objects
- **invariants.md** — 14 business rules (INV-01 through INV-14) with examples and validation matrix
- **domain-events.md** — 22 domain events with triggers, sources, consumers, and payloads
- **lifecycle.md** — State machines for Documento Fuente, Lote, Conciliación, Discrepancia

## Key invariants (quick reference)

- INV-01: Document idempotency via content hash (UNIQUE constraint)
- INV-02: Every transaction must have a source document
- INV-03: Every normalized transaction must have a category
- INV-04: Category names unique (case-insensitive) among active non-merged
- INV-06: Encrypted PDFs require configured decryption key per financial entity
- INV-07: One record participates in max one match per conciliation
- INV-10: Transaction amount cannot be zero
- INV-14: Statement summary unique per credit product + period

## Environment variables

```
# SQLite
DB_PATH=./db/finanzas.db

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=finanzas-raw
R2_PUBLIC_URL=              # For presigned URLs

# Google Drive
GOOGLE_SERVICE_ACCOUNT_KEY= # Path to service account JSON
DRIVE_ARCHIVE_FOLDER_ID=    # Folder ID for FinanzasApp/archive/

# LLM API (evaluate and pick one)
LLM_PROVIDER=               # gemini | anthropic | openai
LLM_API_KEY=
LLM_MODEL=                  # gemini-2.0-flash | claude-haiku | gpt-4o-mini

# Server
PORT=3000
HOST=0.0.0.0
```

## Commands

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed default data
npm run db:seed

# Start API server (development)
npm run dev

# Start API server (production)
npm run start

# Export n8n workflows
npm run n8n:export
```

## n8n workflows (not code — visual)

The ingesta pipeline, conciliation processes, and archive lifecycle are implemented as n8n workflows, not TypeScript code. See `n8n-workflows/README.md` for import instructions.

The API server is the boundary: n8n writes to SQLite and uploads to R2/Drive. The API server reads from SQLite and generates presigned URLs. They share the database file, not an API.

## Peruvian financial context

- **Banks:** BCP, BBVA, Interbank, Scotiabank, IO (BCP's fintech)
- **PDF passwords:** Typically user's DNI (national ID number), configurable per entity
- **Currency:** PEN (soles), USD (dollars)
- **Tax:** SUNAT income tax deduction for personal expenses (15% of qualifying expenses in categories like restaurants, hotels, etc.)
- **Digital wallets:** Yape (BCP), Plin (multi-bank) — categorized as YAPE_PLIN payment type
- **Timezone:** America/Lima (UTC-5), no daylight saving
