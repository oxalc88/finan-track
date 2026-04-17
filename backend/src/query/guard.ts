import type { ValidationResult } from "../domain/types.js";

const FORBIDDEN_KEYWORDS =
	/\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|PRAGMA|ATTACH|DETACH|COPY|EXPORT)\b/i;

const KNOWN_TABLES = new Set([
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
]);

const SELECT_START = /^SELECT\b/i;
const TRAILING_SEMICOLONS = /;+\s*$/;
const LIMIT_CLAUSE = /\bLIMIT\b/i;
const FIN_TABLE_REF = /\bfin\.(\w+)\b/gi;
const UNQUALIFIED_TABLE = /\b(?:FROM|JOIN)\s+(?!fin\b|[\s(])(\w+)/gi;

/**
 * Validates that SQL is read-only: starts with SELECT, no forbidden keywords,
 * no semicolons (multi-statement prevention).
 */
export function validateSqlReadOnly(sql: string): ValidationResult {
	const errors: string[] = [];
	const trimmed = sql.trim();

	if (!SELECT_START.test(trimmed)) {
		errors.push("Query must start with SELECT");
	}

	const forbiddenMatch = trimmed.match(FORBIDDEN_KEYWORDS);
	if (forbiddenMatch) {
		errors.push(`Forbidden keyword: ${forbiddenMatch[0].toUpperCase()}`);
	}

	if (trimmed.includes(";")) {
		errors.push("Semicolons are not allowed (multi-statement prevention)");
	}

	return { errors, valid: errors.length === 0 };
}

/**
 * Validates that all table references use fin.<known_table>.
 * Extracts table names from fin.X patterns and checks against whitelist.
 */
export function validateSqlTableScope(sql: string): ValidationResult {
	const errors: string[] = [];

	// Extract all fin.tablename references
	const tableRefs = sql.matchAll(FIN_TABLE_REF);
	const referencedTables = new Set<string>();

	for (const match of tableRefs) {
		referencedTables.add(match[1].toLowerCase());
	}

	for (const table of referencedTables) {
		if (!KNOWN_TABLES.has(table)) {
			errors.push(`Unknown table: fin.${table}`);
		}
	}

	// Check for table references without fin. prefix (potential bypass)
	// Look for FROM/JOIN followed by a word that's not "fin" or a subquery
	const unqualifiedMatches = sql.matchAll(UNQUALIFIED_TABLE);

	for (const match of unqualifiedMatches) {
		errors.push(
			`Unqualified table reference: ${match[1]}. Use fin.${match[1]} prefix.`
		);
	}

	return { errors, valid: errors.length === 0 };
}

/**
 * Sanitizes SQL: strips trailing semicolons and appends LIMIT 50 if no LIMIT clause.
 */
export function sanitizeSql(sql: string): string {
	let sanitized = sql.trim().replace(TRAILING_SEMICOLONS, "");

	if (!LIMIT_CLAUSE.test(sanitized)) {
		sanitized = `${sanitized} LIMIT 50`;
	}

	return sanitized;
}
