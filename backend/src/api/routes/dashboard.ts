import type Database from "better-sqlite3";
import { Hono } from "hono";
import { buildDashboard } from "../adapters/dashboard.js";

export function createDashboardRoutes(db: Database.Database): Hono {
	const app = new Hono();

	app.get("/", (c) => {
		const data = buildDashboard(db);
		return c.json(data);
	});

	return app;
}
