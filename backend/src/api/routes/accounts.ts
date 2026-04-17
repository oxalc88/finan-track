import {
	CreateAccountSchema,
	UpdateAccountSchema,
	UpdateBalanceSchema,
} from "@finanzas/shared-types";
import type Database from "better-sqlite3";
import { Hono } from "hono";
import {
	create,
	findAll,
	findByEntidad,
	findById,
	update,
	updateBalance,
} from "../../db/repositories/accounts.js";

export function createAccountsRoutes(db: Database.Database): Hono {
	const app = new Hono();

	app.get("/", (c) => {
		const accounts = findAll(db);
		return c.json(accounts);
	});

	app.get("/by-entity/:entityId", (c) => {
		const accounts = findByEntidad(db, c.req.param("entityId"));
		return c.json(accounts);
	});

	app.get("/:id", (c) => {
		const account = findById(db, c.req.param("id"));
		if (!account) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(account);
	});

	app.post("/", async (c) => {
		const body = CreateAccountSchema.parse(await c.req.json());
		const account = create(db, body);
		return c.json(account, 201);
	});

	app.put("/:id", async (c) => {
		const body = UpdateAccountSchema.parse(await c.req.json());
		const account = update(db, { ...body, id: c.req.param("id") });
		if (!account) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(account);
	});

	app.patch("/:id/balance", async (c) => {
		const { saldo } = UpdateBalanceSchema.parse(await c.req.json());
		const account = updateBalance(db, c.req.param("id"), saldo);
		if (!account) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(account);
	});

	return app;
}
