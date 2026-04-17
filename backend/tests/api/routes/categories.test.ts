import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../src/api/middleware/error-handler.js";
import { validationMiddleware } from "../../../src/api/middleware/validation.js";

vi.mock("../../../src/db/repositories/categories.js", () => ({
	findAll: vi.fn(),
	findById: vi.fn(),
	getActiveNames: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	merge: vi.fn(),
}));

import * as categoriesRepo from "../../../src/db/repositories/categories.js";
import { createCategoriesRoutes } from "../../../src/api/routes/categories.js";

function buildApp() {
	const app = new Hono();
	app.use("*", validationMiddleware);
	app.onError(errorHandler);
	app.route("/", createCategoriesRoutes({} as never));
	return app;
}

beforeEach(() => {
	vi.resetAllMocks();
});

describe("POST /categories validation", () => {
	it("returns 422 when nombre is empty", async () => {
		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ nombre: "" }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as { issues: { path: string }[] };
		expect(payload.issues.some((i) => i.path === "nombre")).toBe(true);
		expect(categoriesRepo.create).not.toHaveBeenCalled();
	});

	it("creates a category and returns 201 when the payload is valid and the name is free", async () => {
		vi.mocked(categoriesRepo.getActiveNames).mockReturnValue([]);
		const created = {
			id: "cat_1",
			nombre: "Food",
			es_deducible_sunat: false,
			activa: true,
		};
		vi.mocked(categoriesRepo.create).mockReturnValue(created as never);

		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ nombre: "Food", es_deducible_sunat: false }),
		});

		expect(res.status).toBe(201);
		expect(await res.json()).toEqual(created);
	});

	it("returns 409 when a case-insensitive name collision is detected", async () => {
		vi.mocked(categoriesRepo.getActiveNames).mockReturnValue(["food"]);

		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ nombre: "FOOD", es_deducible_sunat: false }),
		});

		expect(res.status).toBe(409);
		expect(categoriesRepo.create).not.toHaveBeenCalled();
	});
});

describe("PUT /categories/:id validation", () => {
	it("returns 422 when nombre is empty", async () => {
		const app = buildApp();
		const res = await app.request("/cat_1", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ nombre: "" }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as { issues: { path: string }[] };
		expect(payload.issues.some((i) => i.path === "nombre")).toBe(true);
		expect(categoriesRepo.update).not.toHaveBeenCalled();
	});
});

describe("POST /categories/merge validation", () => {
	it("returns 422 when target_id is missing", async () => {
		const app = buildApp();
		const res = await app.request("/merge", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ source_id: "cat_a" }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as { issues: { path: string }[] };
		expect(payload.issues.some((i) => i.path === "target_id")).toBe(true);
		expect(categoriesRepo.merge).not.toHaveBeenCalled();
	});

	it("returns 400 when source_id equals target_id", async () => {
		const app = buildApp();
		const res = await app.request("/merge", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ source_id: "cat_a", target_id: "cat_a" }),
		});

		expect(res.status).toBe(400);
		expect(categoriesRepo.merge).not.toHaveBeenCalled();
	});

	it("returns 404 when the source category doesn't exist", async () => {
		vi.mocked(categoriesRepo.findById).mockImplementation(
			(_db: unknown, id: unknown) =>
				id === "cat_a" ? null : ({ id: "cat_b" } as never),
		);

		const app = buildApp();
		const res = await app.request("/merge", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ source_id: "cat_a", target_id: "cat_b" }),
		});

		expect(res.status).toBe(404);
		expect(categoriesRepo.merge).not.toHaveBeenCalled();
	});

	it("returns 200 with the number of reassigned transactions on success", async () => {
		vi.mocked(categoriesRepo.findById).mockImplementation(
			(_db: unknown, id: unknown) =>
				({ id: String(id), nombre: `cat-${String(id)}` }) as never,
		);
		vi.mocked(categoriesRepo.merge).mockReturnValue(7);

		const app = buildApp();
		const res = await app.request("/merge", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ source_id: "cat_a", target_id: "cat_b" }),
		});

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ transacciones_reasignadas: 7 });
	});
});
