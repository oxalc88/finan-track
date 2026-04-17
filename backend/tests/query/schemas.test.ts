import { describe, expect, it } from "vitest";
import {
	QueryRequestSchema,
	QueryTranslationSchema,
} from "../../src/query/schemas.js";

// ──────────────────────────────────────────────────────────────
// QueryRequestSchema
// ──────────────────────────────────────────────────────────────

describe("QueryRequestSchema", () => {
	it("accepts a valid question string", () => {
		const result = QueryRequestSchema.safeParse({
			question: "¿Cuánto gasté en restaurantes este mes?",
		});
		expect(result.success).toBe(true);
	});

	it("rejects an empty question (min 1)", () => {
		const result = QueryRequestSchema.safeParse({ question: "" });
		expect(result.success).toBe(false);
	});

	it("accepts a question at exactly 500 characters (max boundary)", () => {
		const result = QueryRequestSchema.safeParse({
			question: "a".repeat(500),
		});
		expect(result.success).toBe(true);
	});

	it("rejects a question at 501 characters (over max)", () => {
		const result = QueryRequestSchema.safeParse({
			question: "a".repeat(501),
		});
		expect(result.success).toBe(false);
	});

	it("rejects when question field is missing", () => {
		const result = QueryRequestSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("rejects when question is not a string", () => {
		const result = QueryRequestSchema.safeParse({ question: 42 });
		expect(result.success).toBe(false);
	});
});

// ──────────────────────────────────────────────────────────────
// QueryTranslationSchema
// ──────────────────────────────────────────────────────────────

describe("QueryTranslationSchema", () => {
	it("accepts a valid financial query with sql and explanation", () => {
		const result = QueryTranslationSchema.safeParse({
			is_financial_query: true,
			sql: "SELECT monto FROM fin.transaccion",
			explanation: "Muestra los montos de todas las transacciones",
		});
		expect(result.success).toBe(true);
	});

	it("accepts a valid rejection with rejection_reason and explanation", () => {
		const result = QueryTranslationSchema.safeParse({
			is_financial_query: false,
			rejection_reason: "La pregunta no está relacionada con finanzas",
			explanation: "No se puede procesar esta consulta",
		});
		expect(result.success).toBe(true);
	});

	it("accepts a financial query without optional sql (sql is optional)", () => {
		const result = QueryTranslationSchema.safeParse({
			is_financial_query: true,
			explanation: "Consulta financiera sin SQL todavía",
		});
		expect(result.success).toBe(true);
	});

	it("accepts a non-financial query without optional rejection_reason", () => {
		const result = QueryTranslationSchema.safeParse({
			is_financial_query: false,
			explanation: "No aplica",
		});
		expect(result.success).toBe(true);
	});

	it("rejects when explanation is missing", () => {
		const result = QueryTranslationSchema.safeParse({
			is_financial_query: true,
			sql: "SELECT 1",
		});
		expect(result.success).toBe(false);
	});

	it("rejects when is_financial_query is missing", () => {
		const result = QueryTranslationSchema.safeParse({
			explanation: "Sin campo booleano",
		});
		expect(result.success).toBe(false);
	});

	it("rejects when is_financial_query is not a boolean", () => {
		const result = QueryTranslationSchema.safeParse({
			is_financial_query: "true",
			explanation: "Tipo incorrecto",
		});
		expect(result.success).toBe(false);
	});
});
