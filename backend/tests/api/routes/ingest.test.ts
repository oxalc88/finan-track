import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../src/api/middleware/error-handler.js";
import { validationMiddleware } from "../../../src/api/middleware/validation.js";

vi.mock("../../../src/ingestion/pipeline.js", () => ({
	processDocument: vi.fn(),
}));

import * as pipeline from "../../../src/ingestion/pipeline.js";
import { createIngestRoutes } from "../../../src/api/routes/ingest.js";

function buildApp() {
	const app = new Hono();
	app.use("*", validationMiddleware);
	app.onError(errorHandler);
	app.route("/", createIngestRoutes({} as never));
	return app;
}

function makeFormData(opts: { file?: File; canal?: string } = {}) {
	const fd = new FormData();
	const file =
		opts.file ?? new File([Buffer.from("pdf-bytes")], "test.pdf", {
			type: "application/pdf",
		});
	fd.append("file", file);
	if (opts.canal !== undefined) {
		fd.append("canal", opts.canal);
	}
	return fd;
}

beforeEach(() => {
	vi.resetAllMocks();
});

describe("POST /ingest validation", () => {
	it("returns 422 when canal is missing and does not call the pipeline", async () => {
		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			body: makeFormData({ canal: undefined }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as { issues: { path: string }[] };
		expect(payload.issues.some((i) => i.path === "canal")).toBe(true);
		expect(pipeline.processDocument).not.toHaveBeenCalled();
	});

	it("returns 422 when canal is not in the allowed enum", async () => {
		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			body: makeFormData({ canal: "WHATSAPP" }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as { issues: { path: string }[] };
		expect(payload.issues.some((i) => i.path === "canal")).toBe(true);
		expect(pipeline.processDocument).not.toHaveBeenCalled();
	});

	it("returns 201 when the pipeline reports a NORMALIZADO result", async () => {
		vi.mocked(pipeline.processDocument).mockResolvedValue({
			categorias_nuevas: [],
			documento_id: "doc_1",
			estado: "NORMALIZADO",
			transacciones_creadas: 3,
			warnings: [],
		});

		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			body: makeFormData({ canal: "TELEGRAM" }),
		});

		expect(res.status).toBe(201);
		const payload = (await res.json()) as { estado: string };
		expect(payload.estado).toBe("NORMALIZADO");
	});

	it("returns 422 when the pipeline reports a non-NORMALIZADO estado", async () => {
		vi.mocked(pipeline.processDocument).mockResolvedValue({
			categorias_nuevas: [],
			documento_id: "doc_1",
			estado: "ERROR",
			transacciones_creadas: 0,
			warnings: ["something failed"],
		});

		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			body: makeFormData({ canal: "TELEGRAM" }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as Record<string, unknown>;
		// This is the route's own 422 (not the ZodError middleware); no "issues" array
		expect(Array.isArray((payload as { issues?: unknown }).issues)).toBe(false);
	});
});
