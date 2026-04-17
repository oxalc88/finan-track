import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { createDb } from "../../../src/db/connection.js";
import { runMigrations } from "../../../src/db/schema.js";
import * as batchesRepo from "../../../src/db/repositories/batches.js";
import * as documentsRepo from "../../../src/db/repositories/documents.js";

let db: Database.Database;

beforeEach(() => {
	db = createDb(":memory:");
	runMigrations(db);
});

describe("batches repository", () => {
	describe("create", () => {
		it("returns batch with required fields", () => {
			const batch = batchesRepo.create(db, {
				canal: "TELEGRAM",
				cantidad_documentos: 3,
			});

			expect(batch.id).toBeTruthy();
			expect(batch.canal).toBe("TELEGRAM");
			expect(batch.cantidad_documentos).toBe(3);
		});

		it("defaults estado to EN_PROCESO", () => {
			const batch = batchesRepo.create(db, {
				canal: "DRIVE",
				cantidad_documentos: 2,
			});

			expect(batch.estado).toBe("EN_PROCESO");
		});

		it("completado_en is null by default", () => {
			const batch = batchesRepo.create(db, {
				canal: "TELEGRAM",
				cantidad_documentos: 1,
			});

			expect(batch.completado_en).toBeNull();
		});
	});

	describe("complete", () => {
		it("sets estado to COMPLETADO when all documents are NORMALIZADO", () => {
			const batch = batchesRepo.create(db, {
				canal: "TELEGRAM",
				cantidad_documentos: 2,
			});

			// Add two NORMALIZADO documents to the batch
			const docA = documentsRepo.create(db, {
				hash: "h1",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
				lote_id: batch.id,
			});
			const docB = documentsRepo.create(db, {
				hash: "h2",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
				lote_id: batch.id,
			});

			documentsRepo.updateEstado(db, docA.id, "NORMALIZADO");
			documentsRepo.updateEstado(db, docB.id, "NORMALIZADO");

			const completed = batchesRepo.complete(db, batch.id);
			expect(completed?.estado).toBe("COMPLETADO");
			expect(completed?.completado_en).toBeTruthy();
		});

		it("sets estado to COMPLETADO_CON_ERRORES when some documents have ERROR estado", () => {
			const batch = batchesRepo.create(db, {
				canal: "TELEGRAM",
				cantidad_documentos: 2,
			});

			const docA = documentsRepo.create(db, {
				hash: "h3",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
				lote_id: batch.id,
			});
			const docB = documentsRepo.create(db, {
				hash: "h4",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
				lote_id: batch.id,
			});

			documentsRepo.updateEstado(db, docA.id, "NORMALIZADO");
			documentsRepo.updateEstado(db, docB.id, "ERROR", "Parse failed");

			const completed = batchesRepo.complete(db, batch.id);
			expect(completed?.estado).toBe("COMPLETADO_CON_ERRORES");
			expect(completed?.completado_en).toBeTruthy();
		});

		it("does not change estado when some documents are still in progress", () => {
			const batch = batchesRepo.create(db, {
				canal: "TELEGRAM",
				cantidad_documentos: 2,
			});

			const docA = documentsRepo.create(db, {
				hash: "h5",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
				lote_id: batch.id,
			});
			documentsRepo.create(db, {
				hash: "h6",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
				lote_id: batch.id,
			});

			// Only one doc reaches a terminal state
			documentsRepo.updateEstado(db, docA.id, "NORMALIZADO");

			const result = batchesRepo.complete(db, batch.id);
			// Still EN_PROCESO because docB is still RECIBIDO
			expect(result?.estado).toBe("EN_PROCESO");
		});

		it("returns batch unchanged when no documents are linked", () => {
			const batch = batchesRepo.create(db, {
				canal: "DRIVE",
				cantidad_documentos: 5,
			});

			const result = batchesRepo.complete(db, batch.id);
			expect(result?.estado).toBe("EN_PROCESO");
		});

		it("sets completado_en after completion", () => {
			const batch = batchesRepo.create(db, {
				canal: "TELEGRAM",
				cantidad_documentos: 1,
			});

			const doc = documentsRepo.create(db, {
				hash: "h7",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
				lote_id: batch.id,
			});
			documentsRepo.updateEstado(db, doc.id, "NORMALIZADO");

			const completed = batchesRepo.complete(db, batch.id);
			expect(completed?.completado_en).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		});
	});
});
