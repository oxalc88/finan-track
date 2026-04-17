import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { createDb } from "../../../src/db/connection.js";
import { runMigrations } from "../../../src/db/schema.js";
import * as conciliationsRepo from "../../../src/db/repositories/conciliations.js";

let db: Database.Database;

beforeEach(() => {
	db = createDb(":memory:");
	runMigrations(db);
});

describe("conciliations repository", () => {
	describe("create conciliacion", () => {
		it("returns conciliacion with required fields", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "BANCARIA",
				periodo: "2026-01",
			});

			expect(conciliacion.id).toBeTruthy();
			expect(conciliacion.tipo).toBe("BANCARIA");
			expect(conciliacion.periodo).toBe("2026-01");
		});

		it("defaults estado to PENDIENTE", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "TRIBUTARIA",
				periodo: "2026-01",
			});

			expect(conciliacion.estado).toBe("PENDIENTE");
		});

		it("defaults totals to zero", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "BANCARIA",
				periodo: "2026-02",
			});

			expect(conciliacion.total_registros_fuente_a).toBe(0);
			expect(conciliacion.total_registros_fuente_b).toBe(0);
			expect(conciliacion.total_matches).toBe(0);
			expect(conciliacion.total_discrepancias).toBe(0);
		});

		it("stores provided registro totals", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "BANCARIA",
				periodo: "2026-03",
				total_registros_fuente_a: 10,
				total_registros_fuente_b: 8,
			});

			expect(conciliacion.total_registros_fuente_a).toBe(10);
			expect(conciliacion.total_registros_fuente_b).toBe(8);
		});
	});

	describe("createMatch and findMatchesByConciliacion", () => {
		it("creates a match and retrieves it by conciliacion", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "BANCARIA",
				periodo: "2026-01",
			});

			const match = conciliationsRepo.createMatch(db, {
				conciliacion_id: conciliacion.id,
				registro_fuente_a_id: "tx-001",
				registro_fuente_a_tipo: "transaccion",
				registro_fuente_b_id: "notif-001",
				registro_fuente_b_tipo: "notificacion",
				confianza: 95,
			});

			expect(match.id).toBeTruthy();
			expect(match.conciliacion_id).toBe(conciliacion.id);
			expect(match.confianza).toBe(95);

			const matches = conciliationsRepo.findMatchesByConciliacion(
				db,
				conciliacion.id,
			);
			expect(matches).toHaveLength(1);
			expect(matches[0].id).toBe(match.id);
		});

		it("defaults confirmado to false", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "BANCARIA",
				periodo: "2026-01",
			});

			const match = conciliationsRepo.createMatch(db, {
				conciliacion_id: conciliacion.id,
				registro_fuente_a_id: "tx-002",
				registro_fuente_a_tipo: "transaccion",
				registro_fuente_b_id: "notif-002",
				registro_fuente_b_tipo: "notificacion",
				confianza: 80,
			});

			expect(match.confirmado).toBe(false);
		});

		it("returns empty array when conciliacion has no matches", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "BANCARIA",
				periodo: "2026-01",
			});

			const matches = conciliationsRepo.findMatchesByConciliacion(
				db,
				conciliacion.id,
			);
			expect(matches).toEqual([]);
		});
	});

	describe("getMatchedIds", () => {
		it("returns ids of matched fuente_a records for a conciliacion", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "BANCARIA",
				periodo: "2026-01",
			});

			conciliationsRepo.createMatch(db, {
				conciliacion_id: conciliacion.id,
				registro_fuente_a_id: "tx-10",
				registro_fuente_a_tipo: "transaccion",
				registro_fuente_b_id: "notif-10",
				registro_fuente_b_tipo: "notificacion",
				confianza: 90,
			});
			conciliationsRepo.createMatch(db, {
				conciliacion_id: conciliacion.id,
				registro_fuente_a_id: "tx-11",
				registro_fuente_a_tipo: "transaccion",
				registro_fuente_b_id: "notif-11",
				registro_fuente_b_tipo: "notificacion",
				confianza: 85,
			});

			const ids = conciliationsRepo.getMatchedIds(db, conciliacion.id, "a");
			expect(ids).toContain("tx-10");
			expect(ids).toContain("tx-11");
		});

		it("returns ids of matched fuente_b records", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "BANCARIA",
				periodo: "2026-01",
			});

			conciliationsRepo.createMatch(db, {
				conciliacion_id: conciliacion.id,
				registro_fuente_a_id: "tx-20",
				registro_fuente_a_tipo: "transaccion",
				registro_fuente_b_id: "notif-20",
				registro_fuente_b_tipo: "notificacion",
				confianza: 90,
			});

			const ids = conciliationsRepo.getMatchedIds(db, conciliacion.id, "b");
			expect(ids).toContain("notif-20");
			expect(ids).not.toContain("tx-20");
		});

		it("enforces INV-07: same record cannot participate in two matches", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "BANCARIA",
				periodo: "2026-01",
			});

			conciliationsRepo.createMatch(db, {
				conciliacion_id: conciliacion.id,
				registro_fuente_a_id: "tx-dup",
				registro_fuente_a_tipo: "transaccion",
				registro_fuente_b_id: "notif-30",
				registro_fuente_b_tipo: "notificacion",
				confianza: 90,
			});

			// Second match with same fuente_a_id must fail (UNIQUE constraint)
			expect(() => {
				conciliationsRepo.createMatch(db, {
					conciliacion_id: conciliacion.id,
					registro_fuente_a_id: "tx-dup",
					registro_fuente_a_tipo: "transaccion",
					registro_fuente_b_id: "notif-31",
					registro_fuente_b_tipo: "notificacion",
					confianza: 70,
				});
			}).toThrow();
		});
	});

	describe("createDiscrepancia", () => {
		it("creates a discrepancia with PENDIENTE estado", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "BANCARIA",
				periodo: "2026-01",
			});

			const disc = conciliationsRepo.createDiscrepancia(db, {
				conciliacion_id: conciliacion.id,
				registro_id: "tx-missing",
				registro_tipo: "transaccion",
				fuente: "FUENTE_A",
				tipo: "SIN_MATCH",
			});

			expect(disc.id).toBeTruthy();
			expect(disc.estado).toBe("PENDIENTE");
			expect(disc.tipo).toBe("SIN_MATCH");
			expect(disc.fuente).toBe("FUENTE_A");
		});

		it("finds discrepancias by conciliacion", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "BANCARIA",
				periodo: "2026-01",
			});

			conciliationsRepo.createDiscrepancia(db, {
				conciliacion_id: conciliacion.id,
				registro_id: "tx-d1",
				registro_tipo: "transaccion",
				fuente: "FUENTE_A",
				tipo: "SIN_MATCH",
			});
			conciliationsRepo.createDiscrepancia(db, {
				conciliacion_id: conciliacion.id,
				registro_id: "tx-d2",
				registro_tipo: "transaccion",
				fuente: "FUENTE_B",
				tipo: "MONTO_DIFERENTE",
			});

			const result = conciliationsRepo.findDiscrepanciasByConciliacion(
				db,
				conciliacion.id,
			);
			expect(result).toHaveLength(2);
		});
	});

	describe("resolveDiscrepancia", () => {
		it("sets estado to RESUELTA and stores resolucion", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "BANCARIA",
				periodo: "2026-01",
			});
			const disc = conciliationsRepo.createDiscrepancia(db, {
				conciliacion_id: conciliacion.id,
				registro_id: "tx-resolve",
				registro_tipo: "transaccion",
				fuente: "FUENTE_A",
				tipo: "SIN_MATCH",
			});

			const resolved = conciliationsRepo.resolveDiscrepancia(
				db,
				disc.id,
				"Error del banco corregido",
			);

			expect(resolved?.estado).toBe("RESUELTA");
			expect(resolved?.resolucion).toBe("Error del banco corregido");
			expect(resolved?.resuelta_en).toBeTruthy();
			expect(resolved?.resuelta_en).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		});
	});

	describe("ignoreDiscrepancia", () => {
		it("sets estado to IGNORADA and sets resuelta_en", () => {
			const conciliacion = conciliationsRepo.create(db, {
				tipo: "TRIBUTARIA",
				periodo: "2026-01",
			});
			const disc = conciliationsRepo.createDiscrepancia(db, {
				conciliacion_id: conciliacion.id,
				registro_id: "tx-ignore",
				registro_tipo: "transaccion",
				fuente: "FUENTE_B",
				tipo: "FECHA_DIFERENTE",
			});

			const ignored = conciliationsRepo.ignoreDiscrepancia(db, disc.id);

			expect(ignored?.estado).toBe("IGNORADA");
			expect(ignored?.resuelta_en).toBeTruthy();
			expect(ignored?.resuelta_en).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		});
	});
});
