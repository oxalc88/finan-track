import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../src/api/middleware/error-handler.js";
import { validationMiddleware } from "../../../src/api/middleware/validation.js";

vi.mock("../../../src/query/translate.js", () => ({
	translateQuery: vi.fn(),
}));
vi.mock("../../../src/query/executor.js", () => ({
	executeDuckDbQuery: vi.fn(),
	formatResultAsText: vi.fn(),
}));

import * as executor from "../../../src/query/executor.js";
import * as translator from "../../../src/query/translate.js";
import { createQueryRoutes } from "../../../src/api/routes/query.js";

function buildApp() {
	const app = new Hono();
	app.use("*", validationMiddleware);
	app.onError(errorHandler);
	app.route("/", createQueryRoutes());
	return app;
}

beforeEach(() => {
	vi.resetAllMocks();
});

describe("POST /query validation", () => {
	it("returns 422 when question is empty", async () => {
		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ question: "" }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as { issues: { path: string }[] };
		expect(payload.issues.some((i) => i.path === "question")).toBe(true);
		expect(translator.translateQuery).not.toHaveBeenCalled();
	});

	it("returns 422 when question exceeds 500 characters", async () => {
		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ question: "a".repeat(501) }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as { issues: { path: string }[] };
		expect(payload.issues.some((i) => i.path === "question")).toBe(true);
		expect(translator.translateQuery).not.toHaveBeenCalled();
	});

	it("returns 200 with data=null when the LLM rejects the query as non-financial", async () => {
		vi.mocked(translator.translateQuery).mockResolvedValue({
			is_financial_query: false,
			rejection_reason: "No financial context",
			explanation: "Rejected",
		});

		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ question: "¿Cuál es la capital de Francia?" }),
		});

		expect(res.status).toBe(200);
		const payload = (await res.json()) as {
			data: unknown;
			sql: unknown;
			answer: string;
		};
		expect(payload.data).toBeNull();
		expect(payload.sql).toBeNull();
		expect(payload.answer).toBe("No financial context");
	});

	it("returns 200 with row data when the SQL passes guards and executes successfully", async () => {
		vi.mocked(translator.translateQuery).mockResolvedValue({
			is_financial_query: true,
			sql: "SELECT 1 AS total FROM fin.transaccion",
			explanation: "Total rows",
		});
		vi.mocked(executor.executeDuckDbQuery).mockResolvedValue({
			rows: [{ total: 5 }],
			rowCount: 1,
			executionTimeMs: 12,
		});
		vi.mocked(executor.formatResultAsText).mockReturnValue("Total rows: 5");

		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ question: "¿Cuántas transacciones tengo?" }),
		});

		expect(res.status).toBe(200);
		const payload = (await res.json()) as {
			data: unknown;
			answer: string;
			execution_time_ms: number;
		};
		expect(payload.data).toEqual([{ total: 5 }]);
		expect(payload.answer).toBe("Total rows: 5");
		expect(payload.execution_time_ms).toBe(12);
	});
});
