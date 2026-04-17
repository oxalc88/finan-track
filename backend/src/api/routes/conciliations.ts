import type Database from "better-sqlite3";
import { Hono } from "hono";
import {
	findAll,
	findById,
	findDiscrepanciasByConciliacion,
	findMatchesByConciliacion,
	findPendingDiscrepancias,
	ignoreDiscrepancia,
	resolveDiscrepancia,
} from "../../db/repositories/conciliations.js";
import { validateDiscrepanciaResolucion } from "../../domain/invariants.js";
import { AppError } from "../middleware/error-handler.js";

export function createConciliationsRoutes(db: Database.Database): Hono {
	const app = new Hono();

	app.get("/", (c) => {
		const conciliaciones = findAll(db);
		return c.json(conciliaciones);
	});

	app.get("/discrepancias/pending", (c) => {
		const pending = findPendingDiscrepancias(db);
		return c.json(pending);
	});

	app.get("/:id", (c) => {
		const conciliacion = findById(db, c.req.param("id"));
		if (!conciliacion) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(conciliacion);
	});

	app.get("/:id/matches", (c) => {
		const conciliacion = findById(db, c.req.param("id"));
		if (!conciliacion) {
			return c.json({ error: "Not found" }, 404);
		}

		const matches = findMatchesByConciliacion(db, c.req.param("id"));
		return c.json(matches);
	});

	app.get("/:id/discrepancias", (c) => {
		const conciliacion = findById(db, c.req.param("id"));
		if (!conciliacion) {
			return c.json({ error: "Not found" }, 404);
		}

		const discrepancias = findDiscrepanciasByConciliacion(
			db,
			c.req.param("id")
		);
		return c.json(discrepancias);
	});

	app.patch("/discrepancias/:id/resolve", async (c) => {
		const body = await c.req.json();
		const { resolucion } = body;

		const validation = validateDiscrepanciaResolucion("RESUELTA", resolucion);
		if (!validation.valid) {
			throw new AppError(validation.errors.join("; "), 400);
		}

		const discrepancia = resolveDiscrepancia(db, c.req.param("id"), resolucion);
		if (!discrepancia) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(discrepancia);
	});

	app.patch("/discrepancias/:id/ignore", (c) => {
		const discrepancia = ignoreDiscrepancia(db, c.req.param("id"));
		if (!discrepancia) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(discrepancia);
	});

	return app;
}
