# backend/CLAUDE.md

Domain-specific guidance for Claude Code when working inside
`backend/`. General monorepo conventions live in the root
[`CLAUDE.md`](../CLAUDE.md).

## Domain conventions

- **Money** is always integer centavos (`S/42.50` = `4250`).
  Never floating point in the DB or across the wire. Decimal
  conversion only at the `/api/dashboard` adapter boundary.
- **Rates** are integer basis points (`5.5%` = `550`).
- **Timestamps** are ISO 8601 UTC in SQLite. Format to
  `America/Lima` / `es-PE` only for display.
- **IDs** are ULIDs — chronologically sortable, generated via the
  `ulid` package.
- **Errors** fail fast. Collect all validation errors before
  returning. Never swallow.

## Business invariants (INV-01 … INV-14)

These rules constrain the schema and repositories. Enforce them in
domain code, not at the DB layer alone.

| Code | Rule |
|------|------|
| INV-01 | Document idempotency by content hash (UNIQUE) |
| INV-02 | Every `transaccion` has a source `documento_fuente` |
| INV-03 | Every normalised `transaccion` has a `categoria` |
| INV-04 | Category names unique (case-insensitive) among active non-merged |
| INV-06 | Encrypted PDFs require a configured decryption key per entity |
| INV-07 | A record participates in at most one match per conciliation |
| INV-10 | `transaccion.monto` cannot be zero |
| INV-14 | Statement summary unique per credit product + period |

Validators for these live in `src/domain/invariants.ts`; route
handlers (e.g. `categories.ts` merge, `conciliations.ts` resolve)
call them and surface violations as `AppError` with the appropriate
HTTP status.

## Peruvian financial context

- **Banks:** BCP, BBVA, Interbank, Scotiabank, IO (BCP's fintech).
- **Currencies:** PEN (soles), USD (dollars). Locale `es-PE`.
- **PDF passwords:** typically the user's DNI (national ID). Stored
  per `entidad_financiera` as `clave_descifrado` + `patron_clave`.
- **Digital wallets:** Yape (BCP) and Plin (multi-bank) — both use
  `tipo_pago = 'YAPE_PLIN'`.
- **SUNAT deduction:** 15% income-tax credit on qualifying expenses
  (restaurants, hotels, etc.). Drives the `es_deducible_sunat` and
  `categoria_sunat` columns on `categoria`.
- **Timezone:** `America/Lima` (UTC-5), no DST.

## Code style

- Functional only: plain functions, closures, composition. No
  classes anywhere.
- No ORMs. Use `better-sqlite3` directly with prepared statements;
  SQL is the interface.
- Repositories export named functions: `findAll`, `findById`,
  `create`, `update`, `deactivate`, etc. — never a class.
- Adapters go in `src/api/adapters/` as pure functions. Every
  adapter gets a mocked-repository Vitest in
  `tests/api/adapters/`.

## When extending the API

- POST/PUT/PATCH bodies must be parsed with a Zod schema from
  `@finanzas/shared-types`. A thrown `ZodError` becomes
  `422 { error, issues[] }` via `errorHandler`.
- Business-rule violations (uniqueness, state-machine transitions,
  etc.) throw `AppError(message, statusCode)` — don't return raw
  response objects from deep in the stack.
- Centavo ↔ decimal conversion happens at the dashboard adapter
  only; every other route returns raw Spanish rows.
