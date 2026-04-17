import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../src/api/middleware/error-handler.js";
import { validationMiddleware } from "../../../src/api/middleware/validation.js";

vi.mock("../../../src/db/repositories/products.js", () => ({
	findAll: vi.fn(),
	findByEntidad: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	deactivate: vi.fn(),
}));

import * as productsRepo from "../../../src/db/repositories/products.js";
import { createProductsRoutes } from "../../../src/api/routes/products.js";

function buildApp() {
	const app = new Hono();
	app.use("*", validationMiddleware);
	app.onError(errorHandler);
	app.route("/", createProductsRoutes({} as never));
	return app;
}

const validProductPayload = {
	entidad_financiera_id: "ent_1",
	tipo: "VISA",
	categoria_tarjeta: "GOLD",
	linea_credito: 1_000_000,
	moneda: "PEN",
	fecha_corte: 15,
	fecha_pago: 5,
	tasa_interes: 25.5,
	fecha_apertura: "2024-01-01",
	tipo_beneficio: "NINGUNO",
};

beforeEach(() => {
	vi.resetAllMocks();
});

describe("POST /products validation", () => {
	it("returns 422 when fecha_corte is out of the 1..31 range", async () => {
		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ ...validProductPayload, fecha_corte: 99 }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as { issues: { path: string }[] };
		expect(payload.issues.some((i) => i.path === "fecha_corte")).toBe(true);
		expect(productsRepo.create).not.toHaveBeenCalled();
	});

	it("creates a product and returns 201 when the payload is valid", async () => {
		const created = { id: "prod_1", ...validProductPayload, activo: true };
		vi.mocked(productsRepo.create).mockReturnValue(created as never);

		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(validProductPayload),
		});

		expect(res.status).toBe(201);
		expect(await res.json()).toEqual(created);
		expect(productsRepo.create).toHaveBeenCalledTimes(1);
	});
});

describe("DELETE /products/:id", () => {
	it("returns 200 with the deactivated product when found", async () => {
		const deactivated = {
			id: "prod_1",
			...validProductPayload,
			activo: false,
		};
		vi.mocked(productsRepo.deactivate).mockReturnValue(deactivated as never);

		const app = buildApp();
		const res = await app.request("/prod_1", { method: "DELETE" });

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual(deactivated);
	});

	it("returns 404 when the product doesn't exist", async () => {
		vi.mocked(productsRepo.deactivate).mockReturnValue(null);

		const app = buildApp();
		const res = await app.request("/missing", { method: "DELETE" });

		expect(res.status).toBe(404);
	});
});
