# Test Findings — Domain Layer (Stage 1)

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
