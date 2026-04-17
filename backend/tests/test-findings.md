# Test Findings — Domain Layer (Stage 1) + API Validation (Phase 2)

## Test results — Phase 2 (Zod validation)

**Final:** 35 tests in 7 files, all green after GAP 1 was fixed in
`src/api/middleware/validation.ts` (see Resolution at the bottom).

Initial run: 20 pass, 15 fail, all hitting the same root cause (Gap 1
below).

| File                                             | Tests | Pass | Fail |
|--------------------------------------------------|-------|------|------|
| `tests/api/middleware/validation.test.ts`        | 3     | 2    | 1    |
| `tests/api/routes/entities.test.ts`              | 5     | 3    | 2    |
| `tests/api/routes/accounts.test.ts`              | 7     | 3    | 4    |
| `tests/api/routes/products.test.ts`              | 4     | 3    | 1    |
| `tests/api/routes/categories.test.ts`            | 8     | 5    | 3    |
| `tests/api/routes/ingest.test.ts`                | 4     | 2    | 2    |
| `tests/api/routes/query.test.ts`                 | 4     | 2    | 2    |

All 15 failing assertions are `expected 422, received 500`. Every test
that asserts a **valid** payload path (201/200/404/400/409/200-with-null)
passes, proving:

- The test harness (mocked repositories, Hono in-process `app.request`,
  `buildApp()` with both middleware + `onError(errorHandler)`) is wired
  correctly.
- The route handlers themselves call `schema.parse(...)`, i.e. Phase 2
  integration was actually done in the route files.
- `AppError` still flows through `onError` correctly (409 name-collision,
  400 merge-self, 404 missing source).

## Implementation gaps discovered (to fix in `src/`)

### GAP 1 — `validationMiddleware` can never catch a `ZodError` thrown from a route handler in Hono

**File:** `src/api/middleware/validation.ts`

**Current implementation:**

```ts
export const validationMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (err) {
    if (err instanceof ZodError) { /* 422 … */ }
    throw err;
  }
};
```

**Observed behaviour in Hono 4.12:** when a route handler throws, Hono
does **not** propagate the exception back through the middleware chain
via the `await next()` promise. Instead, Hono routes the error directly
to `app.onError`, and `await next()` **resolves normally** after the
error path has already produced a 500 response. The `catch` block in
this middleware therefore never runs for route-handler errors.

I reproduced this in isolation with two probes:

- A debug middleware logging around `await next()` confirmed the `catch`
  block is never entered; the line after `await next()` always runs and
  `c.res.status` is already `500` by then.
- Mounting `validationMiddleware` **plus** `onError(errorHandler)` on a
  Hono app and throwing a real `ZodError` from the handler yields
  `500 { error: "Internal server error" }` — the middleware's 422 branch
  is dead code.

**Fix options (pick one):**

1. Replace the try/catch middleware with an `onError` hook that
   recognises `ZodError` before `errorHandler`. E.g.

   ```ts
   app.onError((err, c) => {
     if (err instanceof ZodError) return c.json({ error: "Validation failed", issues: ... }, 422);
     return errorHandler(err, c);
   });
   ```

2. Parse inside the middleware using a per-route schema (Hono's
   `@hono/zod-validator` pattern).

3. Wrap each route handler's `schema.parse(...)` call in a try/catch and
   return 422 explicitly. Verbose, but keeps middleware out of it.

Option 1 is the smallest change and preserves the existing "single
middleware catches everywhere" intent from the task description.

**What passes today:** the middleware *does* correctly pass through the
happy path and *does* correctly rethrow non-Zod errors thrown from
**other middleware** (both covered by the green tests
`passes through when the handler does not throw` and `rethrows non-Zod
errors so the global error handler can catch them`). The broken case is
specifically "error thrown from inside a route handler."

## Resolution

GAP 1 fixed in `src/api/middleware/validation.ts`. Replaced the
try/catch-around-next wrapper with an after-next inspection of
`c.error`:

```ts
export const validationMiddleware: MiddlewareHandler = async (c, next) => {
  await next();
  const err = c.error;
  if (err instanceof ZodError) {
    c.res = c.json({ error: "Validation failed", issues: [...] }, 422);
  }
};
```

This works because Hono's compose loop catches the route-handler
exception at its own dispatch level, routes it to `app.onError`, and
sets `context.error`. The middleware then reads `c.error` after
`next()` returns and rewrites `c.res` when it's a `ZodError`. Non-Zod
errors are left untouched for `errorHandler` / the default 500.

All 35 Phase 2 tests pass after this fix. The 179 non-DB tests in the
repo all pass. The pre-existing 145 DB-test failures in `tests/db/**`
are unrelated (better-sqlite3 native binding is missing for this
platform).

### GAP 2 — No other gaps

Every other aspect Phase 2 was supposed to deliver works:

- Each route file imports its schema from `@finanzas/shared-types` and
  calls `schema.parse(...)` before touching the repository (verified:
  invalid payloads end up at `onError` with a `ZodError` → 500, rather
  than reaching the mocked repository function, which is never called
  in the failing tests).
- The category route's two-layer validation works: Zod shape check
  first, then `validateCategoriaNombreUnico` / `validateMergeCategoria`
  invariant checks throwing `AppError`. The 409, 400, 404, and 200
  branches all return the expected status codes.
- The ingest route's own 422 (non-`NORMALIZADO` pipeline result) is
  distinct from a Zod 422 — its body has no `issues` array. Test
  `returns 422 when the pipeline reports a non-NORMALIZADO estado`
  documents that behavioural difference.
- The query route's two result shapes (rejection with `data: null`,
  success with `data: [rows]`) are preserved.

## Design signals

### 1. `TipoDocumento` union in `PipelineResult.estado`

`PipelineResult.estado` is typed `"ERROR" | "NORMALIZADO"` in
`src/ingestion/pipeline.ts`, not `"INVALIDO"` as the task brief
suggested. The ingest route treats **any** non-`NORMALIZADO` estado as
422. I tested with `"ERROR"` because that is what the current type
allows; if `"INVALIDO"` is added later the route code will still map it
to 422 correctly (the check is `result.estado === "NORMALIZADO" ? 201 :
422`).

### 2. `onError(errorHandler)` must be mounted for the category invariants to surface

Without `app.onError(errorHandler)` the 409/400/404 branches in the
category routes become 500s (Hono's default for uncaught errors). The
server wiring in `src/api/index.ts` should mount `errorHandler`
explicitly. The route tests assume that setup via `buildApp()`.

### 3. Zod 4 `.partial()` on `CreateEntitySchema` still rejects enum violations

`UpdateEntitySchema = CreateEntitySchema.partial()` — partial makes
every field optional, but when a field **is** supplied it must still
match the underlying validator. I confirmed by sending
`{ tipo: "FOO" }` to `PUT /entities/:id`; the schema rejects with a
`ZodError` on path `tipo`. So the enum constraint survives
`.partial()`, which is the correct Zod v4 behaviour.

---

# Test Findings — Domain Layer (Stage 1)

(Original findings preserved below.)

## Test results

All 126 tests pass across 5 test files.

| File | Tests | Status |
|------|-------|--------|
| `tests/domain/types.test.ts` | 21 | PASS |
| `tests/domain/invariants.test.ts` | 74 | PASS |
| `tests/domain/events.test.ts` | 7 | PASS |
| `tests/db/connection.test.ts` | 5 | PASS |
| `tests/db/schema-and-seed.test.ts` | 19 | PASS |

## Design signals

### 1. `as const` arrays are NOT runtime-frozen

**File:** `src/domain/types.ts`

`Object.isFrozen()` returns `false` for every exported const array
(`CANALES`, `TIPOS_DOCUMENTO`, etc.). TypeScript's `as const` is a
compile-time readonly annotation only — it does not call `Object.freeze()`
at runtime.

**Impact:** Any runtime code could push/pop values from these arrays if it
receives them as a mutable reference. Since the arrays are module-level
constants used as DB CHECK constraint sets, mutation is unlikely in
practice, but nothing prevents it.

**Recommendation (low priority):** If you want runtime immutability, call
`Object.freeze(CANALES)` etc. in `types.ts`, or use a linting rule to
enforce that consumers never mutate them. The tests were adjusted to match
actual runtime behavior (testing content, not freeze state).

### 2. `runMigrations` logs to stdout per migration, once per test

**File:** `src/db/schema.ts`

Each test in `schema-and-seed.test.ts` that calls `runMigrations` prints
"Migration 001_initial_schema.sql applied (version 1)" to stdout. This is
noisy in CI output for a test suite with many schema tests.

**Recommendation:** Accept a logger parameter (or pass a no-op logger in
test context). This is a minor DX issue, not a correctness problem.

### 3. `seedDefaultData` has no return value

**File:** `src/db/seed.ts`

The function logs how many entities were seeded but returns `void`. The
test must query the database to verify the side effect.

**Recommendation:** Consider returning a count or the inserted IDs so
callers (and tests) can confirm the outcome without a separate DB query.
Low priority — the current approach is simple and testable.

### 4. `runMigrations` uses `import.meta.dirname` (Node 22+ only)

**File:** `src/db/schema.ts`, line 9

`import.meta.dirname` is available in Node.js 22+. If the project ever
needs to run on Node 20, this will break. The `mise.toml` should constrain
the Node version to document this dependency.

## Gaps noticed

None. All 14 invariants and 4 state machine validators are covered. The
DB schema creates all 11 tables that are listed in `CLAUDE.md`.
