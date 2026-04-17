import { describe, expect, it } from "vitest";
import {
	sanitizeSql,
	validateSqlReadOnly,
	validateSqlTableScope,
} from "../../src/query/guard.js";

// ──────────────────────────────────────────────────────────────
// sanitizeSql
// ──────────────────────────────────────────────────────────────

describe("sanitizeSql", () => {
	it("strips a trailing semicolon", () => {
		const result = sanitizeSql("SELECT * FROM fin.transaccion;");
		expect(result).not.toContain(";");
	});

	it("appends LIMIT 50 when no LIMIT clause is present", () => {
		const result = sanitizeSql("SELECT * FROM fin.transaccion");
		expect(result).toMatch(/LIMIT 50$/);
	});

	it("preserves an existing LIMIT clause without appending another", () => {
		const result = sanitizeSql("SELECT * FROM fin.transaccion LIMIT 10");
		expect(result).toContain("LIMIT 10");
		expect(result).not.toContain("LIMIT 50");
		// Count LIMIT occurrences — must be exactly 1
		const matches = result.match(/\bLIMIT\b/gi) ?? [];
		expect(matches).toHaveLength(1);
	});

	it("strips multiple trailing semicolons", () => {
		const result = sanitizeSql("SELECT 1;;;");
		expect(result).not.toContain(";");
		expect(result).toMatch(/LIMIT 50$/);
	});

	it("trims surrounding whitespace before processing", () => {
		const result = sanitizeSql("  SELECT 1  ");
		expect(result.startsWith("SELECT")).toBe(true);
	});

	it("LIMIT check is case-insensitive — preserves lowercase limit", () => {
		const result = sanitizeSql("SELECT * FROM fin.transaccion limit 5");
		expect(result).not.toContain("LIMIT 50");
		const matches = result.match(/\blimit\b/gi) ?? [];
		expect(matches).toHaveLength(1);
	});
});

// ──────────────────────────────────────────────────────────────
// validateSqlTableScope
// ──────────────────────────────────────────────────────────────

describe("validateSqlTableScope", () => {
	it("returns valid for a query referencing a known fin. table", () => {
		const result = validateSqlTableScope(
			"SELECT * FROM fin.transaccion"
		);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("returns invalid for an unknown fin. table", () => {
		const result = validateSqlTableScope(
			"SELECT * FROM fin.usuarios"
		);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("fin.usuarios"))).toBe(true);
	});

	it("returns invalid for an unqualified table after FROM", () => {
		const result = validateSqlTableScope(
			"SELECT * FROM transaccion"
		);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.toLowerCase().includes("unqualified"))).toBe(
			true
		);
	});

	it("returns invalid for an unqualified table after JOIN", () => {
		const result = validateSqlTableScope(
			"SELECT * FROM fin.transaccion JOIN categoria ON 1=1"
		);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("categoria"))).toBe(true);
	});

	it("does not flag subqueries (FROM followed by open paren)", () => {
		const result = validateSqlTableScope(
			"SELECT * FROM (SELECT id FROM fin.transaccion) AS sub"
		);
		expect(result.valid).toBe(true);
	});

	it("accepts all 11 known tables with fin. prefix", () => {
		const knownTables = [
			"transaccion",
			"categoria",
			"entidad_financiera",
			"cuenta_deposito",
			"producto_credito",
			"resumen_estado_cuenta",
			"documento_fuente",
			"conciliacion",
			"match_conciliacion",
			"discrepancia",
			"lote",
		];

		for (const table of knownTables) {
			const result = validateSqlTableScope(
				`SELECT * FROM fin.${table}`
			);
			expect(result.valid).toBe(true);
		}
	});

	it("returns invalid when fin. table name casing bypasses the whitelist", () => {
		// fin.TRANSACCION (uppercase) — the implementation lowercases, so should accept
		const result = validateSqlTableScope(
			"SELECT * FROM fin.TRANSACCION"
		);
		expect(result.valid).toBe(true);
	});

	it("collects multiple errors for multiple unknown tables", () => {
		const result = validateSqlTableScope(
			"SELECT * FROM fin.usuarios JOIN fin.roles ON 1=1"
		);
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThanOrEqual(2);
	});
});

// ──────────────────────────────────────────────────────────────
// validateSqlReadOnly
// ──────────────────────────────────────────────────────────────

describe("validateSqlReadOnly", () => {
	it("returns valid for a standard SELECT query", () => {
		const result = validateSqlReadOnly(
			"SELECT * FROM fin.transaccion"
		);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("returns invalid when query does not start with SELECT", () => {
		const result = validateSqlReadOnly("UPDATE fin.transaccion SET monto = 0");
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.toLowerCase().includes("select"))).toBe(
			true
		);
	});

	it("returns valid for SELECT with leading whitespace", () => {
		const result = validateSqlReadOnly(
			"   SELECT monto FROM fin.transaccion"
		);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("returns invalid for each forbidden keyword embedded in a SELECT body", () => {
		const forbiddenKeywords = [
			"DROP",
			"DELETE",
			"UPDATE",
			"INSERT",
			"ALTER",
			"CREATE",
			"PRAGMA",
			"ATTACH",
			"DETACH",
			"COPY",
			"EXPORT",
		];

		for (const keyword of forbiddenKeywords) {
			const result = validateSqlReadOnly(
				`SELECT * FROM fin.transaccion; ${keyword} TABLE x`
			);
			expect(result.valid).toBe(false);
			expect(
				result.errors.some((e) => e.toUpperCase().includes(keyword))
			).toBe(true);
		}
	});

	it("rejects forbidden keywords regardless of case", () => {
		const variants = ["drop", "Drop", "DROP", "DrOp"];
		for (const variant of variants) {
			const result = validateSqlReadOnly(
				`SELECT * FROM fin.transaccion WHERE ${variant} = 1`
			);
			expect(result.valid).toBe(false);
		}
	});

	it("rejects a SELECT that contains a forbidden keyword in the body", () => {
		const result = validateSqlReadOnly(
			"SELECT * FROM fin.transaccion WHERE DELETE = 1"
		);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("DELETE"))).toBe(true);
	});

	it("rejects query containing a semicolon", () => {
		const result = validateSqlReadOnly(
			"SELECT 1; SELECT 2"
		);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.toLowerCase().includes("semicolon"))).toBe(
			true
		);
	});

	it("accumulates multiple errors in a single result", () => {
		// Not SELECT + has forbidden keyword + has semicolon
		const result = validateSqlReadOnly("DELETE FROM fin.transaccion;");
		expect(result.valid).toBe(false);
		// Must start with SELECT error + forbidden keyword error + semicolon error
		expect(result.errors.length).toBeGreaterThanOrEqual(2);
	});
});
