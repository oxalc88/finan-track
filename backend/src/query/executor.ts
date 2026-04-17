import { execFile } from "node:child_process";
import { resolve } from "node:path";
import type { QueryResult } from "./schemas.js";

/**
 * Executes a read-only SQL query against SQLite via DuckDB CLI.
 * Uses execFile (no shell) to prevent shell injection.
 */
export function executeDuckDbQuery(
	sql: string,
	dbPath?: string
): Promise<QueryResult> {
	const resolvedPath = resolve(
		dbPath ?? process.env.DB_PATH ?? "./db/finanzas.db"
	);
	const fullQuery = `ATTACH '${resolvedPath}' AS fin (TYPE sqlite); ${sql}`;

	const startTime = Date.now();

	return new Promise((resolvePromise, reject) => {
		execFile(
			"duckdb",
			["-json", "-c", fullQuery],
			{ timeout: 10_000, maxBuffer: 1024 * 1024 },
			(error, stdout, stderr) => {
				const executionTimeMs = Date.now() - startTime;

				if (error) {
					reject(
						new Error(`DuckDB execution failed: ${stderr || error.message}`)
					);
					return;
				}

				const trimmed = stdout.trim();
				if (!trimmed) {
					resolvePromise({ rows: [], rowCount: 0, executionTimeMs });
					return;
				}

				try {
					const rows = JSON.parse(trimmed) as Record<string, unknown>[];
					resolvePromise({ rows, rowCount: rows.length, executionTimeMs });
				} catch {
					reject(new Error("Failed to parse DuckDB output"));
				}
			}
		);
	});
}

/**
 * Formats query results as human-readable Spanish text.
 */
export function formatResultAsText(
	rows: Record<string, unknown>[],
	explanation: string
): string {
	if (rows.length === 0) {
		return "No se encontraron resultados.";
	}

	// Single value result
	if (rows.length === 1) {
		const keys = Object.keys(rows[0]);
		if (keys.length === 1) {
			return `${explanation}: ${rows[0][keys[0]]}`;
		}
	}

	// Multiple rows — build text summary
	const keys = Object.keys(rows[0]);
	const lines = [explanation, ""];

	for (const row of rows) {
		const parts = keys.map((k) => `${k}: ${row[k]}`);
		lines.push(`- ${parts.join(", ")}`);
	}

	return lines.join("\n");
}
