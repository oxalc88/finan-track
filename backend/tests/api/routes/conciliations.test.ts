import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../src/api/middleware/error-handler.js";
import { validationMiddleware } from "../../../src/api/middleware/validation.js";

vi.mock("../../../src/db/repositories/conciliations.js", () => ({
	findAll: vi.fn(),
	findById: vi.fn(),
	findDiscrepanciasByConciliacion: vi.fn(),
	findMatchesByConciliacion: vi.fn(),
	findPendingDiscrepancias: vi.fn(),
	ignoreDiscrepancia: vi.fn(),
	resolveDiscrepancia: vi.fn(),
}));

import * as repo from "../../../src/db/repositories/conciliations.js";
import { createConciliationsRoutes } from "../../../src/api/routes/conciliations.js";

function buildApp() {
	const app = new Hono();
	app.use("*", validationMiddleware);
	app.onError(errorHandler);
	app.route("/", createConciliationsRoutes({} as never));
	return app;
}

beforeEach(() => {
	vi.resetAllMocks();
});

describe("PATCH /discrepancias/:id/resolve", () => {
	it("returns 422 with Zod issues when the body is missing 'resolucion'", async () => {
		const app = buildApp();

		const res = await app.request("/discrepancias/disc_1/resolve", {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({}),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as {
			error: string;
			issues: { path: string }[];
		};
		expect(payload.error).toBe("Validation failed");
		expect(payload.issues.some((i) => i.path === "resolucion")).toBe(true);
		expect(repo.resolveDiscrepancia).not.toHaveBeenCalled();
	});

	it("returns 422 when 'resolucion' is an empty string", async () => {
		const app = buildApp();

		const res = await app.request("/discrepancias/disc_1/resolve", {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ resolucion: "" }),
		});

		expect(res.status).toBe(422);
		expect(repo.resolveDiscrepancia).not.toHaveBeenCalled();
	});

	it("resolves and returns 200 when the payload is valid", async () => {
		const fixture = {
			id: "disc_1",
			conciliacion_id: "conc_1",
			estado: "RESUELTA",
			resolucion: "Reembolso aplicado",
		};
		vi.mocked(repo.resolveDiscrepancia).mockReturnValue(fixture as never);

		const app = buildApp();
		const res = await app.request("/discrepancias/disc_1/resolve", {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ resolucion: "Reembolso aplicado" }),
		});

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual(fixture);
		expect(repo.resolveDiscrepancia).toHaveBeenCalledWith(
			expect.anything(),
			"disc_1",
			"Reembolso aplicado",
		);
	});

	it("returns 404 when the repository reports no such discrepancia", async () => {
		vi.mocked(repo.resolveDiscrepancia).mockReturnValue(null);

		const app = buildApp();
		const res = await app.request("/discrepancias/missing/resolve", {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ resolucion: "Anything" }),
		});

		expect(res.status).toBe(404);
	});
});

describe("PATCH /discrepancias/:id/ignore", () => {
	it("returns 200 with the updated row when the repo finds it", async () => {
		const fixture = { id: "disc_1", estado: "IGNORADA" };
		vi.mocked(repo.ignoreDiscrepancia).mockReturnValue(fixture as never);

		const app = buildApp();
		const res = await app.request("/discrepancias/disc_1/ignore", {
			method: "PATCH",
		});

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual(fixture);
	});

	it("returns 404 when the repo returns null", async () => {
		vi.mocked(repo.ignoreDiscrepancia).mockReturnValue(null);

		const app = buildApp();
		const res = await app.request("/discrepancias/missing/ignore", {
			method: "PATCH",
		});

		expect(res.status).toBe(404);
	});
});
