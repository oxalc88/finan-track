import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { createDb } from "../../../src/db/connection.js";
import { runMigrations } from "../../../src/db/schema.js";
import * as documentsRepo from "../../../src/db/repositories/documents.js";

let db: Database.Database;

beforeEach(() => {
	db = createDb(":memory:");
	runMigrations(db);
});

describe("documents repository", () => {
	describe("create", () => {
		it("returns document with estado RECIBIDO by default", () => {
			const doc = documentsRepo.create(db, {
				hash: "abc123",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
			});

			expect(doc.id).toBeTruthy();
			expect(doc.estado).toBe("RECIBIDO");
		});

		it("returns document with storage_tier HOT by default", () => {
			const doc = documentsRepo.create(db, {
				hash: "xyz789",
				canal: "EMAIL",
				tipo: "FACTURA",
				formato: "PDF",
			});

			expect(doc.storage_tier).toBe("HOT");
		});

		it("defaults cifrado to false", () => {
			const doc = documentsRepo.create(db, {
				hash: "hash001",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
			});

			expect(doc.cifrado).toBe(false);
		});

		it("stores optional fields when provided", () => {
			const doc = documentsRepo.create(db, {
				hash: "hash002",
				canal: "DRIVE",
				tipo: "ESTADO_CUENTA",
				formato: "PDF",
				nombre_archivo: "estado_enero.pdf",
				cifrado: true,
				r2_key: "finanzas-raw/2026/01/estado_enero.pdf",
			});

			expect(doc.nombre_archivo).toBe("estado_enero.pdf");
			expect(doc.cifrado).toBe(true);
			expect(doc.r2_key).toBe("finanzas-raw/2026/01/estado_enero.pdf");
		});
	});

	describe("findByHash", () => {
		it("finds document by content hash", () => {
			const hash = "unique-content-hash-abc";
			documentsRepo.create(db, {
				hash,
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
			});

			const found = documentsRepo.findByHash(db, hash);
			expect(found).not.toBeNull();
			expect(found?.hash).toBe(hash);
		});

		it("returns null for unknown hash", () => {
			const found = documentsRepo.findByHash(db, "nonexistent-hash");
			expect(found).toBeNull();
		});

		it("is used to enforce idempotency - cannot insert duplicate hash", () => {
			const hash = "duplicate-hash";
			documentsRepo.create(db, {
				hash,
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
			});

			expect(() => {
				documentsRepo.create(db, {
					hash,
					canal: "EMAIL",
					tipo: "FACTURA",
					formato: "PDF",
				});
			}).toThrow();
		});
	});

	describe("updateEstado", () => {
		it("changes estado to PROCESANDO", () => {
			const doc = documentsRepo.create(db, {
				hash: "h1",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
			});

			const updated = documentsRepo.updateEstado(db, doc.id, "PROCESANDO");
			expect(updated?.estado).toBe("PROCESANDO");
		});

		it("sets procesado_en when estado changes to NORMALIZADO", () => {
			const doc = documentsRepo.create(db, {
				hash: "h2",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
			});

			const updated = documentsRepo.updateEstado(db, doc.id, "NORMALIZADO");
			expect(updated?.estado).toBe("NORMALIZADO");
			expect(updated?.procesado_en).toBeTruthy();
			expect(updated?.procesado_en).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		});

		it("does not set procesado_en for ERROR estado", () => {
			const doc = documentsRepo.create(db, {
				hash: "h3",
				canal: "EMAIL",
				tipo: "FACTURA",
				formato: "PDF",
			});

			const updated = documentsRepo.updateEstado(
				db,
				doc.id,
				"ERROR",
				"Parse failed",
			);
			expect(updated?.estado).toBe("ERROR");
			expect(updated?.procesado_en).toBeNull();
			expect(updated?.error_detalle).toBe("Parse failed");
		});
	});

	describe("findArchiveCandidates", () => {
		it("finds documents in HOT tier older than the threshold", () => {
			// Insert a document with a recibido_en far in the past
			const id = "01ARCHIVEME00000000000000";
			db.prepare(`
				INSERT INTO documento_fuente (id, hash, canal, tipo, formato, storage_tier, recibido_en)
				VALUES (?, 'old-doc', 'TELEGRAM', 'VOUCHER', 'IMAGEN', 'HOT', datetime('now', '-200 days'))
			`).run(id);

			const candidates = documentsRepo.findArchiveCandidates(db, 180);
			expect(candidates.length).toBeGreaterThanOrEqual(1);
			expect(candidates.some((d) => d.id === id)).toBe(true);
		});

		it("does not return recent HOT documents", () => {
			documentsRepo.create(db, {
				hash: "recent-hash",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
			});

			const candidates = documentsRepo.findArchiveCandidates(db, 180);
			expect(candidates).toHaveLength(0);
		});

		it("does not return documents already in ARCHIVE tier", () => {
			const id = "01ARCHIVED000000000000000";
			db.prepare(`
				INSERT INTO documento_fuente (id, hash, canal, tipo, formato, storage_tier, recibido_en)
				VALUES (?, 'already-archived', 'TELEGRAM', 'VOUCHER', 'IMAGEN', 'ARCHIVE', datetime('now', '-200 days'))
			`).run(id);

			const candidates = documentsRepo.findArchiveCandidates(db, 180);
			expect(candidates.some((d) => d.id === id)).toBe(false);
		});
	});

	describe("markArchived", () => {
		it("sets storage_tier to ARCHIVE", () => {
			const doc = documentsRepo.create(db, {
				hash: "to-archive",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
				r2_key: "some/r2/key",
			});

			const archived = documentsRepo.markArchived(db, doc.id);
			expect(archived?.storage_tier).toBe("ARCHIVE");
		});

		it("clears r2_key after archiving", () => {
			const doc = documentsRepo.create(db, {
				hash: "to-archive-2",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
				r2_key: "some/r2/key",
			});

			const archived = documentsRepo.markArchived(db, doc.id);
			expect(archived?.r2_key).toBeNull();
		});
	});
});
