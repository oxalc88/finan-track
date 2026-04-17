import type Database from "better-sqlite3";
import { Hono } from "hono";
import { findAll, findById } from "../../db/repositories/transactions.js";
import type { TransactionFilter } from "../../domain/types.js";

export function createTransactionsRoutes(db: Database.Database): Hono {
	const app = new Hono();

	app.get("/", (c) => {
		const query = c.req.query();

		const filter: TransactionFilter = {
			periodo_inicio: query.periodo_inicio,
			periodo_fin: query.periodo_fin,
			tipo_pago: query.tipo_pago as TransactionFilter["tipo_pago"],
			moneda: query.moneda as TransactionFilter["moneda"],
			comercio: query.comercio,
			categorias: query.categorias?.split(","),
			cuentas: query.cuentas?.split(","),
			productos: query.productos?.split(","),
			monto_minimo: query.monto_minimo ? Number(query.monto_minimo) : undefined,
			monto_maximo: query.monto_maximo ? Number(query.monto_maximo) : undefined,
			es_deducible_ir:
				query.es_deducible_ir !== undefined
					? query.es_deducible_ir === "true"
					: undefined,
			limit: query.limit ? Number(query.limit) : undefined,
			offset: query.offset ? Number(query.offset) : undefined,
		};

		const result = findAll(db, filter);
		return c.json({
			data: result.data,
			total: result.total,
			limit: filter.limit ?? 50,
			offset: filter.offset ?? 0,
		});
	});

	app.get("/:id", (c) => {
		const transaction = findById(db, c.req.param("id"));
		if (!transaction) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(transaction);
	});

	return app;
}
