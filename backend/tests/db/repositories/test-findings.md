# Test Findings — Repository Layer (Stage 2)

## Summary

10 test files, 121 tests — all passing.

| File | Tests | Status |
|------|-------|--------|
| entities.test.ts | 12 | PASS |
| accounts.test.ts | 9 | PASS |
| products.test.ts | 10 | PASS |
| categories.test.ts | 16 | PASS |
| documents.test.ts | 15 | PASS |
| transactions.test.ts | 16 | PASS |
| statements.test.ts | 8 | PASS |
| batches.test.ts | 8 | PASS |
| conciliations.test.ts | 14 | PASS |
| analytics.test.ts | 13 | PASS |

---

## What was tested

### entities.ts
- `create` returns entity with id, nombre, tipo, timestamps, clave_descifrado, patron_clave
- `findAll` returns empty list, all entities, ordered by nombre
- `findById` returns entity or null
- `update` modifies nombre/tipo, sets actualizado_en, returns null for unknown id, returns entity unchanged when no updateable fields given

### accounts.ts
- `create` returns account linked to entity; defaults saldo=0; stores saldo, tasa_interes, proposito
- `findByEntidad` returns only accounts for the given entity; excludes other entities; returns empty list
- `updateBalance` updates saldo and sets saldo_actualizado_en and actualizado_en; returns null for unknown id

### products.ts
- `create` returns product with activo=true; links to entity; stores all required fields; respects activo=false when provided
- `findAll` returns only active products; excludes deactivated products
- `findAllIncludingInactive` returns both active and inactive
- `deactivate` sets activo=false; sets actualizado_en; returns null for unknown id

### categories.ts
- `create` returns activa=true; defaults es_deducible_sunat=false; stores optional fields
- `findAll` returns only active non-merged; excludes inactive; excludes merged
- `findByNombre` finds by exact match; case-insensitive; returns null for unknown; does not find merged categories
- `getActiveNames` returns names; ordered alphabetically; excludes merged/inactive
- `merge` reassigns transactions from source to target; marks source as merged and inactive; returns count of reassigned transactions

### documents.ts
- `create` returns RECIBIDO estado; HOT storage_tier; cifrado=false by default; stores optional fields
- `findByHash` finds by hash; returns null; enforces idempotency (UNIQUE constraint throws on duplicate hash)
- `updateEstado` changes estado; sets procesado_en only on NORMALIZADO; stores error_detalle; does not set procesado_en on ERROR
- `findArchiveCandidates` returns HOT documents older than threshold; excludes recent documents; excludes ARCHIVE-tier documents
- `markArchived` sets storage_tier=ARCHIVE; clears r2_key

### transactions.ts
- `create` returns transaction linked to document; defaults es_deducible_ir=false; stores es_deducible_ir=true
- `findAll` no filter returns all with correct total; period filter; category filter; amount range filter; partial comercio match; es_deducible_ir filter
- Pagination: limit respected with correct total; offset produces non-overlapping pages
- `updateCategory` changes categoria_id and origen_categoria
- `markDeductible` toggles es_deducible_ir to true and false
- `bulkUpdateCategory` updates all from source to target; returns 0 when source is empty

### statements.ts
- `create` returns statement with required fields; stores linea_disponible as null; stores linea_disponible when provided
- `findByProducto` returns statements for product; excludes statements from other products
- `findByProductoAndPeriodo` finds by product+period; returns null when not found; enforces uniqueness (UNIQUE constraint throws on duplicate)

### batches.ts
- `create` returns batch with canal and cantidad_documentos; defaults estado=EN_PROCESO; completado_en=null
- `complete` sets COMPLETADO when all documents are NORMALIZADO; sets COMPLETADO_CON_ERRORES on mixed terminal states; does not advance when non-terminal documents remain; returns unchanged batch when no documents linked; sets completado_en on completion

### conciliations.ts
- `create` returns conciliacion with tipo/periodo; defaults estado=PENDIENTE; defaults all totals to 0; stores provided totals
- `createMatch` + `findMatchesByConciliacion`: creates and retrieves match; defaults confirmado=false; returns empty list
- `getMatchedIds` returns fuente_a ids; returns fuente_b ids; enforces INV-07 (UNIQUE constraint on conciliacion_id+registro_fuente_a_id throws on duplicate)
- `createDiscrepancia` + `findDiscrepanciasByConciliacion`: creates with PENDIENTE estado; finds by conciliacion
- `resolveDiscrepancia` sets RESUELTA, stores resolucion, sets resuelta_en
- `ignoreDiscrepancia` sets IGNORADA, sets resuelta_en

### analytics.ts
- `spendByCategory` aggregates by category; excludes out-of-period transactions; empty when no data
- `monthlyTrend` groups by month; correctly separates gastos (negative) from ingresos (positive); empty when no data
- `pipelineStatus` counts by estado; empty when no documents
- `debtEvolution` joins statements with product and entity; empty when no statements
- `deductibleTotals` aggregates by categoria_sunat for year; excludes non-deductible transactions
- `topCommerces` returns comercio aggregates; respects limit

---

## Design signals

### `spendByCategory` sort order
The query orders by `total ASC`. For a "spend by category" analytics function, descending order (highest spend first) is the more typical expectation for dashboards. This is a product decision, but callers should be aware the list is ascending.

### `topCommerces` sort order
Similarly orders by `total ASC`. The function is named "top commerces" which implies descending; the current order returns the lowest-spend commerces first. This may be intentional (e.g., cheapest commerces) but the name is misleading. Recommend renaming to `bottomCommerces` or changing `ASC` to `DESC`.

### `monthlyTrend` gastos/ingresos convention
The function discriminates expenses (monto < 0) from income (monto > 0). This means transaction amounts must be signed at ingestion time (negative = expense, positive = income). This convention is not enforced at the schema level — the `transaccion` table only has `CHECK (monto != 0)`. If the LLM normalizer always produces positive amounts, this query will return all zeros for `gastos`. This is worth documenting or enforcing at the ingestion layer.

### `complete` in batches.ts updates cantidad_documentos even when not all terminal
When `counts.terminal < counts.total` (not yet complete), the function still updates `cantidad_documentos` from the actual document count. This is correct behavior but it means the originally declared `cantidad_documentos` in `CreateLoteInput` is effectively overwritten the first time `complete` is called. Tests confirm this.

### No `findAll` on accounts repository exposed in public API
The `accounts.ts` repository exports `findAll` but it is not exercised in the route layer (based on `accounts.ts` route file scope). No test gap — the function exists and is simple — but it should either be used or removed.

---

## Gaps noticed

1. `categories.ts — update` is not covered. There are no tests for partial field updates on a category (e.g., renaming, toggling es_deducible_sunat). This is low priority since `merge` covers the most important mutation path.

2. `conciliations.ts — confirmMatch` is not covered. The function sets `confirmado = 1` on a match but there are no tests for it. Worth adding.

3. `documents.ts — findByLote` is not covered. Only relevant once lote integration is tested end-to-end.

4. `transactions.ts — findByDocumento` is not covered. Low risk since it mirrors `findAll` with a single WHERE clause.

---

## Recommended fixes (by priority)

1. **HIGH — `topCommerces` sort order**: either rename to reflect ascending order or change to `ORDER BY total DESC` so the function matches its name.
2. **MEDIUM — `monthlyTrend` sign convention**: document the signed-amount convention in `CLAUDE.md` under "Money" or add a note in `analytics.ts`. Without this, callers may misread zero gastos as "no expenses".
3. **LOW — add `confirmMatch` test**: straightforward — create a match, call `confirmMatch`, verify `confirmado` is true.
