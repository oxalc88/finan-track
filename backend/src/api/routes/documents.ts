import type Database from "better-sqlite3";
import { Hono } from "hono";
import { findAll, findById } from "../../db/repositories/documents.js";
import type { EstadoDocumento } from "../../domain/types.js";
import { createR2Client, generatePresignedUrl } from "../../storage/r2.js";
import { AppError } from "../middleware/error-handler.js";

export function createDocumentsRoutes(db: Database.Database): Hono {
	const app = new Hono();

	app.get("/", (c) => {
		const query = c.req.query();
		const options = {
			estado: query.estado as EstadoDocumento | undefined,
			limit: query.limit ? Number(query.limit) : undefined,
			offset: query.offset ? Number(query.offset) : undefined,
		};

		const documents = findAll(db, options);
		return c.json(documents);
	});

	app.get("/:id", (c) => {
		const document = findById(db, c.req.param("id"));
		if (!document) {
			return c.json({ error: "Not found" }, 404);
		}
		return c.json(document);
	});

	app.get("/:id/url", async (c) => {
		const document = findById(db, c.req.param("id"));
		if (!document) {
			return c.json({ error: "Not found" }, 404);
		}

		if (document.storage_tier === "ARCHIVE") {
			if (!document.drive_file_id) {
				throw new AppError(
					"Document is archived but has no Drive file ID",
					404
				);
			}
			return c.json({
				url: `https://drive.google.com/file/d/${document.drive_file_id}/view`,
				tier: "ARCHIVE",
			});
		}

		// HOT tier — generate presigned URL from R2
		if (!document.r2_key) {
			throw new AppError("Document has no R2 key", 404);
		}

		try {
			const r2 = createR2Client();
			const url = await generatePresignedUrl(r2, document.r2_key);
			return c.json({ url, tier: "HOT" });
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "R2 presigned URL generation failed";
			throw new AppError(`Could not generate presigned URL: ${message}`, 500);
		}
	});

	return app;
}
