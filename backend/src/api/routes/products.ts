import {
	CreateProductSchema,
	UpdateProductSchema,
} from "@finanzas/shared-types";
import type Database from "better-sqlite3";
import { Hono } from "hono";
import {
	create,
	deactivate,
	findAll,
	findByEntidad,
	findById,
	update,
} from "../../db/repositories/products.js";

export function createProductsRoutes(db: Database.Database): Hono {
	const app = new Hono();

	app.get("/", (c) => {
		const products = findAll(db);
		return c.json(products);
	});

	app.get("/by-entity/:entityId", (c) => {
		const products = findByEntidad(db, c.req.param("entityId"));
		return c.json(products);
	});

	app.get("/:id", (c) => {
		const product = findById(db, c.req.param("id"));
		if (!product) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(product);
	});

	app.post("/", async (c) => {
		const body = CreateProductSchema.parse(await c.req.json());
		const product = create(db, body);
		return c.json(product, 201);
	});

	app.put("/:id", async (c) => {
		const body = UpdateProductSchema.parse(await c.req.json());
		const product = update(db, { ...body, id: c.req.param("id") });
		if (!product) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(product);
	});

	app.delete("/:id", (c) => {
		const product = deactivate(db, c.req.param("id"));
		if (!product) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(product);
	});

	return app;
}
