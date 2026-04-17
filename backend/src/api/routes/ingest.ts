import type Database from "better-sqlite3";
import { Hono } from "hono";
import type { Canal } from "../../domain/types.js";
import { processDocument } from "../../ingestion/pipeline.js";
import { AppError } from "../middleware/error-handler.js";

const VALID_CANALES = new Set(["TELEGRAM", "EMAIL", "DRIVE"]);

export function createIngestRoutes(db: Database.Database) {
	const app = new Hono();

	app.post("/", async (c) => {
		const formData = await c.req.formData();

		const file = formData.get("file");
		if (!(file instanceof File)) {
			throw new AppError("Field 'file' is required and must be a file", 400);
		}

		const canal = formData.get("canal");
		if (!canal || typeof canal !== "string" || !VALID_CANALES.has(canal)) {
			throw new AppError(
				"Field 'canal' is required and must be one of: TELEGRAM, EMAIL, DRIVE",
				400
			);
		}

		const entidadFinancieraId =
			formData.get("entidad_financiera_id")?.toString() || undefined;
		const productoCreditoId =
			formData.get("producto_credito_id")?.toString() || undefined;
		const password = formData.get("password")?.toString() || undefined;

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const result = await processDocument(db, {
			buffer,
			canal: canal as Canal,
			entidad_financiera_id: entidadFinancieraId,
			nombre_archivo: file.name || undefined,
			password,
			producto_credito_id: productoCreditoId,
		});

		const statusCode = result.estado === "NORMALIZADO" ? 201 : 422;
		return c.json(result, statusCode);
	});

	return app;
}
