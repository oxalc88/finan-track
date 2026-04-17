import {
	CreateCategorySchema,
	MergeCategoriesSchema,
	UpdateCategorySchema,
} from "@finanzas/shared-types";
import type Database from "better-sqlite3";
import { Hono } from "hono";
import {
	create,
	findAll,
	findById,
	getActiveNames,
	merge,
	update,
} from "../../db/repositories/categories.js";
import {
	validateCategoriaNombreUnico,
	validateMergeCategoria,
} from "../../domain/invariants.js";
import { AppError } from "../middleware/error-handler.js";

export function createCategoriesRoutes(db: Database.Database): Hono {
	const app = new Hono();

	app.get("/", (c) => {
		const categories = findAll(db);
		return c.json(categories);
	});

	app.get("/:id", (c) => {
		const category = findById(db, c.req.param("id"));
		if (!category) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(category);
	});

	app.post("/", async (c) => {
		const body = CreateCategorySchema.parse(await c.req.json());

		const existingNames = getActiveNames(db);
		const validation = validateCategoriaNombreUnico(body.nombre, existingNames);
		if (!validation.valid) {
			throw new AppError(validation.errors.join("; "), 409);
		}

		const category = create(db, body);
		return c.json(category, 201);
	});

	app.put("/:id", async (c) => {
		const body = UpdateCategorySchema.parse(await c.req.json());
		const category = update(db, { ...body, id: c.req.param("id") });
		if (!category) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(category);
	});

	app.post("/merge", async (c) => {
		const { source_id, target_id } = MergeCategoriesSchema.parse(
			await c.req.json(),
		);

		const mergeValidation = validateMergeCategoria(source_id, target_id);
		if (!mergeValidation.valid) {
			throw new AppError(mergeValidation.errors.join("; "), 400);
		}

		const source = findById(db, source_id);
		if (!source) {
			throw new AppError("Source category not found", 404);
		}

		const target = findById(db, target_id);
		if (!target) {
			throw new AppError("Target category not found", 404);
		}

		const transacciones_reasignadas = merge(db, source_id, target_id);
		return c.json({ transacciones_reasignadas });
	});

	return app;
}
