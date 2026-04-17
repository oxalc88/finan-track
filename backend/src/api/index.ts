import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createDb } from "../db/connection.js";
import { runMigrations } from "../db/schema.js";
import { errorHandler } from "./middleware/error-handler.js";
import { validationMiddleware } from "./middleware/validation.js";
import { createAccountsRoutes } from "./routes/accounts.js";
import { createCategoriesRoutes } from "./routes/categories.js";
import { createConciliationsRoutes } from "./routes/conciliations.js";
import { createDocumentsRoutes } from "./routes/documents.js";
import { createEntitiesRoutes } from "./routes/entities.js";
import { createIngestRoutes } from "./routes/ingest.js";
import { createProductsRoutes } from "./routes/products.js";
import { createQueryRoutes } from "./routes/query.js";
import { createSummaryRoutes } from "./routes/summary.js";
import { createTransactionsRoutes } from "./routes/transactions.js";

const db = createDb();
runMigrations(db);

const app = new Hono();

app.onError(errorHandler);
app.use("*", validationMiddleware);

app.route("/api/entities", createEntitiesRoutes(db));
app.route("/api/accounts", createAccountsRoutes(db));
app.route("/api/products", createProductsRoutes(db));
app.route("/api/categories", createCategoriesRoutes(db));
app.route("/api/transactions", createTransactionsRoutes(db));
app.route("/api/documents", createDocumentsRoutes(db));
app.route("/api/ingest", createIngestRoutes(db));
app.route("/api/conciliations", createConciliationsRoutes(db));
app.route("/api/summary", createSummaryRoutes(db));
app.route("/api/query", createQueryRoutes());

app.get("/api/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? "0.0.0.0";

serve({ fetch: app.fetch, port, hostname }, (info) => {
	console.log(`FinanzasApp API running at http://${hostname}:${info.port}`);
});

export default app;
