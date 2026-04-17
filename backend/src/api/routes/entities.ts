import type Database from "better-sqlite3";
import { Hono } from "hono";
import {
	create,
	findAll,
	findById,
	update,
} from "../../db/repositories/entities.js";

export function createEntitiesRoutes(db: Database.Database): Hono {
	const app = new Hono();

	app.get("/", (c) => {
		const entities = findAll(db);
		return c.json(entities);
	});

	app.get("/:id", (c) => {
		const entity = findById(db, c.req.param("id"));
		if (!entity) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(entity);
	});

	app.post("/", async (c) => {
		const body = await c.req.json();
		const entity = create(db, body);
		return c.json(entity, 201);
	});

	app.put("/:id", async (c) => {
		const body = await c.req.json();
		const entity = update(db, { ...body, id: c.req.param("id") });
		if (!entity) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(entity);
	});

	return app;
}
