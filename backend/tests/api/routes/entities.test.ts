import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../src/api/middleware/error-handler.js";
import { validationMiddleware } from "../../../src/api/middleware/validation.js";

vi.mock("../../../src/db/repositories/entities.js", () => ({
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
}));

// Import after mock
import * as entitiesRepo from "../../../src/db/repositories/entities.js";
import { createEntitiesRoutes } from "../../../src/api/routes/entities.js";

function buildApp() {
	const app = new Hono();
	app.use("*", validationMiddleware);
	app.onError(errorHandler);
	app.route("/", createEntitiesRoutes({} as never));
	return app;
}

beforeEach(() => {
	vi.resetAllMocks();
});

describe("POST /entities validation", () => {
	it("returns 422 with Zod issues when required fields are missing", async () => {
		const app = buildApp();

		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ clave_descifrado: "x", patron_clave: "y" }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as {
			error: string;
			issues: { path: string; message: string; code: string }[];
		};
		expect(payload.error).toBe("Validation failed");
		const paths = payload.issues.map((i) => i.path);
		expect(paths).toContain("nombre");
		expect(paths).toContain("tipo");
		expect(entitiesRepo.create).not.toHaveBeenCalled();
	});

	it("creates an entity and returns 201 when the payload is valid", async () => {
		const created = {
			id: "ent_1",
			nombre: "BCP",
			tipo: "BANCO",
			clave_descifrado: "key",
			patron_clave: "pattern",
		};
		vi.mocked(entitiesRepo.create).mockReturnValue(created as never);

		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				nombre: "BCP",
				tipo: "BANCO",
				clave_descifrado: "key",
				patron_clave: "pattern",
			}),
		});

		expect(res.status).toBe(201);
		expect(await res.json()).toEqual(created);
		expect(entitiesRepo.create).toHaveBeenCalledTimes(1);
	});
});

describe("PUT /entities/:id validation", () => {
	it("returns 422 when tipo is not in the allowed enum", async () => {
		const app = buildApp();

		const res = await app.request("/ent_1", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ tipo: "FOO" }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as {
			error: string;
			issues: { path: string }[];
		};
		expect(payload.error).toBe("Validation failed");
		expect(payload.issues.some((i) => i.path === "tipo")).toBe(true);
		expect(entitiesRepo.update).not.toHaveBeenCalled();
	});

	it("updates the entity and returns 200 when the payload is valid", async () => {
		const updated = {
			id: "ent_1",
			nombre: "Updated",
			tipo: "BANCO",
			clave_descifrado: "k",
			patron_clave: "p",
		};
		vi.mocked(entitiesRepo.update).mockReturnValue(updated as never);

		const app = buildApp();
		const res = await app.request("/ent_1", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ nombre: "Updated" }),
		});

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual(updated);
	});

	it("returns 404 when the repository update returns null", async () => {
		vi.mocked(entitiesRepo.update).mockReturnValue(null);

		const app = buildApp();
		const res = await app.request("/missing", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ nombre: "Anything" }),
		});

		expect(res.status).toBe(404);
	});
});
