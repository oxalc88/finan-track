import type Database from "better-sqlite3";
import { Hono } from "hono";
import {
	debtEvolution,
	deductibleTotals,
	monthlyTrend,
	pipelineStatus,
	spendByCategory,
	topCommerces,
} from "../../db/repositories/analytics.js";
import { AppError } from "../middleware/error-handler.js";

export function createSummaryRoutes(db: Database.Database): Hono {
	const app = new Hono();

	app.get("/spend-by-category", (c) => {
		const from = c.req.query("from");
		const to = c.req.query("to");
		if (!(from && to)) {
			throw new AppError("Query params 'from' and 'to' are required", 400);
		}

		const result = spendByCategory(db, from, to);
		return c.json(result);
	});

	app.get("/monthly-trend", (c) => {
		const from = c.req.query("from");
		const to = c.req.query("to");
		if (!(from && to)) {
			throw new AppError("Query params 'from' and 'to' are required", 400);
		}

		const result = monthlyTrend(db, from, to);
		return c.json(result);
	});

	app.get("/debt-evolution", (c) => {
		const result = debtEvolution(db);
		return c.json(result);
	});

	app.get("/deductible", (c) => {
		const year = c.req.query("year");
		if (!year) {
			throw new AppError("Query param 'year' is required", 400);
		}

		const result = deductibleTotals(db, year);
		return c.json(result);
	});

	app.get("/top-commerces", (c) => {
		const from = c.req.query("from");
		const to = c.req.query("to");
		if (!(from && to)) {
			throw new AppError("Query params 'from' and 'to' are required", 400);
		}

		const limit = c.req.query("limit")
			? Number(c.req.query("limit"))
			: undefined;
		const result = topCommerces(db, from, to, limit);
		return c.json(result);
	});

	app.get("/pipeline-status", (c) => {
		const result = pipelineStatus(db);
		return c.json(result);
	});

	return app;
}
