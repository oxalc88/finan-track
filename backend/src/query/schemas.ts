import { z } from "zod";

// Re-export the shared API request schema so callers have one source of truth.
export { QueryRequestSchema } from "@finanzas/shared-types";
export type { QueryRequest } from "@finanzas/shared-types";

// ──────────────────────────────────────────────────────────────
// LLM structured output schema
// ──────────────────────────────────────────────────────────────

export const QueryTranslationSchema = z.object({
	is_financial_query: z
		.boolean()
		.describe(
			"True if the question is about personal finances. False for unrelated topics."
		),
	rejection_reason: z
		.string()
		.optional()
		.describe("Why the question was rejected, if is_financial_query is false"),
	sql: z
		.string()
		.optional()
		.describe(
			"DuckDB-compatible SELECT query using fin.* tables. Only present if is_financial_query is true."
		),
	explanation: z
		.string()
		.describe("Brief explanation of what the query does, in Spanish"),
});

export type QueryTranslation = z.infer<typeof QueryTranslationSchema>;

// ──────────────────────────────────────────────────────────────
// Query result types
// ──────────────────────────────────────────────────────────────

export interface QueryResult {
	readonly executionTimeMs: number;
	readonly rowCount: number;
	readonly rows: Record<string, unknown>[];
}
