import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../src/api/middleware/error-handler.js";
import { validationMiddleware } from "../../../src/api/middleware/validation.js";

vi.mock("../../../src/db/repositories/accounts.js", () => ({
	findAll: vi.fn(),
	findByEntidad: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	updateBalance: vi.fn(),
}));

import * as accountsRepo from "../../../src/db/repositories/accounts.js";
import { createAccountsRoutes } from "../../../src/api/routes/accounts.js";

function buildApp() {
	const app = new Hono();
	app.use("*", validationMiddleware);
	app.onError(errorHandler);
	app.route("/", createAccountsRoutes({} as never));
	return app;
}

beforeEach(() => {
	vi.resetAllMocks();
});

describe("POST /accounts validation", () => {
	it("returns 422 when moneda is not a recognized currency", async () => {
		const app = buildApp();

		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				entidad_financiera_id: "ent_1",
				tipo: "AHORRO",
				moneda: "XYZ",
			}),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as {
			error: string;
			issues: { path: string }[];
		};
		expect(payload.error).toBe("Validation failed");
		expect(payload.issues.some((i) => i.path === "moneda")).toBe(true);
		expect(accountsRepo.create).not.toHaveBeenCalled();
	});

	it("returns 422 when entidad_financiera_id is missing", async () => {
		const app = buildApp();

		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ tipo: "AHORRO", moneda: "PEN" }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as {
			issues: { path: string }[];
		};
		expect(
			payload.issues.some((i) => i.path === "entidad_financiera_id"),
		).toBe(true);
	});

	it("creates an account and returns 201 when the payload is valid", async () => {
		const created = {
			id: "acc_1",
			entidad_financiera_id: "ent_1",
			tipo: "AHORRO",
			moneda: "PEN",
			saldo: 0,
		};
		vi.mocked(accountsRepo.create).mockReturnValue(created as never);

		const app = buildApp();
		const res = await app.request("/", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				entidad_financiera_id: "ent_1",
				tipo: "AHORRO",
				moneda: "PEN",
			}),
		});

		expect(res.status).toBe(201);
		expect(await res.json()).toEqual(created);
		expect(accountsRepo.create).toHaveBeenCalledTimes(1);
	});
});

describe("PUT /accounts/:id validation", () => {
	it("updates and returns 200 with a valid partial payload", async () => {
		const updated = {
			id: "acc_1",
			entidad_financiera_id: "ent_1",
			tipo: "AHORRO",
			moneda: "PEN",
			saldo: 100,
		};
		vi.mocked(accountsRepo.update).mockReturnValue(updated as never);

		const app = buildApp();
		const res = await app.request("/acc_1", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ proposito: "savings" }),
		});

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual(updated);
	});
});

describe("PATCH /accounts/:id/balance validation", () => {
	it("returns 422 when saldo is a non-numeric value", async () => {
		const app = buildApp();
		const res = await app.request("/acc_1/balance", {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ saldo: "abc" }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as { issues: { path: string }[] };
		expect(payload.issues.some((i) => i.path === "saldo")).toBe(true);
		expect(accountsRepo.updateBalance).not.toHaveBeenCalled();
	});

	it("returns 422 when saldo is a non-integer number", async () => {
		const app = buildApp();
		const res = await app.request("/acc_1/balance", {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ saldo: 10.5 }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as { issues: { path: string }[] };
		expect(payload.issues.some((i) => i.path === "saldo")).toBe(true);
		expect(accountsRepo.updateBalance).not.toHaveBeenCalled();
	});

	it("calls updateBalance(db, id, saldo) and returns 200 when the payload is valid", async () => {
		const updated = {
			id: "acc_1",
			entidad_financiera_id: "ent_1",
			tipo: "AHORRO",
			moneda: "PEN",
			saldo: 1234,
		};
		vi.mocked(accountsRepo.updateBalance).mockReturnValue(updated as never);

		const app = buildApp();
		const res = await app.request("/acc_1/balance", {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ saldo: 1234 }),
		});

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual(updated);
		expect(accountsRepo.updateBalance).toHaveBeenCalledTimes(1);
		const call = vi.mocked(accountsRepo.updateBalance).mock.calls[0];
		expect(call[1]).toBe("acc_1");
		expect(call[2]).toBe(1234);
	});
});
