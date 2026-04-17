import { IngestRequestSchema } from "@finanzas/shared-types";
import type Database from "better-sqlite3";
import { Hono } from "hono";
import { processDocument } from "../../ingestion/pipeline.js";
import { AppError } from "../middleware/error-handler.js";

export function createIngestRoutes(db: Database.Database) {
	const app = new Hono();

	app.post("/", async (c) => {
		const formData = await c.req.formData();

		const file = formData.get("file");
		if (!(file instanceof File)) {
			throw new AppError("Field 'file' is required and must be a file", 400);
		}

		const parsed = IngestRequestSchema.parse({
			canal: formData.get("canal"),
			entidad_financiera_id:
				formData.get("entidad_financiera_id")?.toString() || undefined,
			producto_credito_id:
				formData.get("producto_credito_id")?.toString() || undefined,
			password: formData.get("password")?.toString() || undefined,
		});

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const result = await processDocument(db, {
			buffer,
			canal: parsed.canal,
			entidad_financiera_id: parsed.entidad_financiera_id,
			nombre_archivo: file.name || undefined,
			password: parsed.password,
			producto_credito_id: parsed.producto_credito_id,
		});

		const statusCode = result.estado === "NORMALIZADO" ? 201 : 422;
		return c.json(result, statusCode);
	});

	return app;
}
