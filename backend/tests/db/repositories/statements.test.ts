import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { createDb } from "../../../src/db/connection.js";
import { runMigrations } from "../../../src/db/schema.js";
import * as statementsRepo from "../../../src/db/repositories/statements.js";
import { createTestEntity, createTestProduct, createTestDocument } from "./helpers.js";

let db: Database.Database;

beforeEach(() => {
	db = createDb(":memory:");
	runMigrations(db);
});

describe("statements repository", () => {
	describe("create", () => {
		it("returns statement with required fields", () => {
			const entityId = createTestEntity(db);
			const productId = createTestProduct(db, entityId);
			const docId = createTestDocument(db);

			const statement = statementsRepo.create(db, {
				documento_fuente_id: docId,
				producto_credito_id: productId,
				periodo_inicio: "2026-01-01",
				periodo_fin: "2026-01-31",
				fecha_pago: "2026-02-10",
				deuda_total: 120000,
				pago_minimo: 15000,
				moneda: "PEN",
				cantidad_transacciones: 5,
			});

			expect(statement.id).toBeTruthy();
			expect(statement.producto_credito_id).toBe(productId);
			expect(statement.documento_fuente_id).toBe(docId);
			expect(statement.deuda_total).toBe(120000);
			expect(statement.pago_minimo).toBe(15000);
		});

		it("stores optional linea_disponible as null when not provided", () => {
			const entityId = createTestEntity(db);
			const productId = createTestProduct(db, entityId);
			const docId = createTestDocument(db);

			const statement = statementsRepo.create(db, {
				documento_fuente_id: docId,
				producto_credito_id: productId,
				periodo_inicio: "2026-01-01",
				periodo_fin: "2026-01-31",
				fecha_pago: "2026-02-10",
				deuda_total: 80000,
				pago_minimo: 10000,
				moneda: "PEN",
				cantidad_transacciones: 3,
			});

			expect(statement.linea_disponible).toBeNull();
		});

		it("stores linea_disponible when provided", () => {
			const entityId = createTestEntity(db);
			const productId = createTestProduct(db, entityId);
			const docId = createTestDocument(db);

			const statement = statementsRepo.create(db, {
				documento_fuente_id: docId,
				producto_credito_id: productId,
				periodo_inicio: "2026-01-01",
				periodo_fin: "2026-01-31",
				fecha_pago: "2026-02-10",
				deuda_total: 80000,
				pago_minimo: 10000,
				moneda: "PEN",
				cantidad_transacciones: 3,
				linea_disponible: 420000,
			});

			expect(statement.linea_disponible).toBe(420000);
		});
	});

	describe("findByProducto", () => {
		it("returns statements for the given product", () => {
			const entityId = createTestEntity(db);
			const productId = createTestProduct(db, entityId);

			const docA = createTestDocument(db);
			const docB = createTestDocument(db);

			statementsRepo.create(db, {
				documento_fuente_id: docA,
				producto_credito_id: productId,
				periodo_inicio: "2026-01-01",
				periodo_fin: "2026-01-31",
				fecha_pago: "2026-02-10",
				deuda_total: 100000,
				pago_minimo: 12000,
				moneda: "PEN",
				cantidad_transacciones: 4,
			});
			statementsRepo.create(db, {
				documento_fuente_id: docB,
				producto_credito_id: productId,
				periodo_inicio: "2026-02-01",
				periodo_fin: "2026-02-28",
				fecha_pago: "2026-03-10",
				deuda_total: 90000,
				pago_minimo: 11000,
				moneda: "PEN",
				cantidad_transacciones: 3,
			});

			const result = statementsRepo.findByProducto(db, productId);
			expect(result).toHaveLength(2);
			expect(result.every((s) => s.producto_credito_id === productId)).toBe(
				true,
			);
		});

		it("does not return statements from other products", () => {
			const entityId = createTestEntity(db);
			const productA = createTestProduct(db, entityId);
			const productB = createTestProduct(db, entityId);

			const docA = createTestDocument(db);
			const docB = createTestDocument(db);

			statementsRepo.create(db, {
				documento_fuente_id: docA,
				producto_credito_id: productA,
				periodo_inicio: "2026-01-01",
				periodo_fin: "2026-01-31",
				fecha_pago: "2026-02-10",
				deuda_total: 100000,
				pago_minimo: 12000,
				moneda: "PEN",
				cantidad_transacciones: 4,
			});
			statementsRepo.create(db, {
				documento_fuente_id: docB,
				producto_credito_id: productB,
				periodo_inicio: "2026-01-01",
				periodo_fin: "2026-01-31",
				fecha_pago: "2026-02-10",
				deuda_total: 50000,
				pago_minimo: 6000,
				moneda: "PEN",
				cantidad_transacciones: 2,
			});

			const resultA = statementsRepo.findByProducto(db, productA);
			expect(resultA).toHaveLength(1);
			expect(resultA[0].producto_credito_id).toBe(productA);
		});
	});

	describe("findByProductoAndPeriodo", () => {
		it("finds statement by product and period", () => {
			const entityId = createTestEntity(db);
			const productId = createTestProduct(db, entityId);
			const docId = createTestDocument(db);

			statementsRepo.create(db, {
				documento_fuente_id: docId,
				producto_credito_id: productId,
				periodo_inicio: "2026-01-01",
				periodo_fin: "2026-01-31",
				fecha_pago: "2026-02-10",
				deuda_total: 100000,
				pago_minimo: 12000,
				moneda: "PEN",
				cantidad_transacciones: 4,
			});

			const found = statementsRepo.findByProductoAndPeriodo(
				db,
				productId,
				"2026-01-01",
				"2026-01-31",
			);

			expect(found).not.toBeNull();
			expect(found?.producto_credito_id).toBe(productId);
		});

		it("returns null when no statement matches product and period", () => {
			const entityId = createTestEntity(db);
			const productId = createTestProduct(db, entityId);

			const found = statementsRepo.findByProductoAndPeriodo(
				db,
				productId,
				"2026-01-01",
				"2026-01-31",
			);

			expect(found).toBeNull();
		});

		it("enforces uniqueness - duplicate product+period throws", () => {
			const entityId = createTestEntity(db);
			const productId = createTestProduct(db, entityId);
			const docA = createTestDocument(db);
			const docB = createTestDocument(db);

			statementsRepo.create(db, {
				documento_fuente_id: docA,
				producto_credito_id: productId,
				periodo_inicio: "2026-01-01",
				periodo_fin: "2026-01-31",
				fecha_pago: "2026-02-10",
				deuda_total: 100000,
				pago_minimo: 12000,
				moneda: "PEN",
				cantidad_transacciones: 4,
			});

			expect(() => {
				statementsRepo.create(db, {
					documento_fuente_id: docB,
					producto_credito_id: productId,
					periodo_inicio: "2026-01-01",
					periodo_fin: "2026-01-31",
					fecha_pago: "2026-02-10",
					deuda_total: 100000,
					pago_minimo: 12000,
					moneda: "PEN",
					cantidad_transacciones: 4,
				});
			}).toThrow();
		});
	});
});
