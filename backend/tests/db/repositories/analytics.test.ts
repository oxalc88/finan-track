import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { createDb } from "../../../src/db/connection.js";
import { runMigrations } from "../../../src/db/schema.js";
import * as analyticsRepo from "../../../src/db/repositories/analytics.js";
import * as transactionsRepo from "../../../src/db/repositories/transactions.js";
import * as statementsRepo from "../../../src/db/repositories/statements.js";
import * as documentsRepo from "../../../src/db/repositories/documents.js";
import {
	createTestEntity,
	createTestCategory,
	createTestDocument,
	createTestProduct,
} from "./helpers.js";

let db: Database.Database;

beforeEach(() => {
	db = createDb(":memory:");
	runMigrations(db);
});

describe("analytics repository", () => {
	describe("spendByCategory", () => {
		it("returns spend aggregated by category for the given period", () => {
			const docId = createTestDocument(db);
			const catA = createTestCategory(db, "Restaurantes");
			const catB = createTestCategory(db, "Transporte");

			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 5000,
				moneda: "PEN",
				comercio: "El Rincon",
				categoria_id: catA,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-20",
				monto: 3000,
				moneda: "PEN",
				comercio: "El Rincon 2",
				categoria_id: catA,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "EFECTIVO",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-18",
				monto: 1500,
				moneda: "PEN",
				comercio: "Uber",
				categoria_id: catB,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});

			const result = analyticsRepo.spendByCategory(
				db,
				"2026-01-01",
				"2026-01-31",
			);

			expect(result).toHaveLength(2);
			const restaurantes = result.find((r) => r.id === catA);
			expect(restaurantes?.total).toBe(8000);
			expect(restaurantes?.cantidad).toBe(2);

			const transporte = result.find((r) => r.id === catB);
			expect(transporte?.total).toBe(1500);
			expect(transporte?.cantidad).toBe(1);
		});

		it("excludes transactions outside the period", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db, "Restaurantes");

			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 5000,
				moneda: "PEN",
				comercio: "In period",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-03-10",
				monto: 9000,
				moneda: "PEN",
				comercio: "Out of period",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});

			const result = analyticsRepo.spendByCategory(
				db,
				"2026-01-01",
				"2026-01-31",
			);

			expect(result).toHaveLength(1);
			expect(result[0].total).toBe(5000);
		});

		it("returns empty array when no transactions in period", () => {
			const result = analyticsRepo.spendByCategory(
				db,
				"2026-01-01",
				"2026-01-31",
			);
			expect(result).toEqual([]);
		});
	});

	describe("monthlyTrend", () => {
		it("groups transactions by month within the period", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			// January: two expenses
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-10",
				monto: -3000,
				moneda: "PEN",
				comercio: "A",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-20",
				monto: -2000,
				moneda: "PEN",
				comercio: "B",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});
			// February: one expense, one income
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-02-05",
				monto: -5000,
				moneda: "PEN",
				comercio: "C",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-02-15",
				monto: 10000,
				moneda: "PEN",
				comercio: "Salary",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TRANSFERENCIA",
			});

			const result = analyticsRepo.monthlyTrend(db, "2026-01-01", "2026-02-28");

			expect(result).toHaveLength(2);

			const jan = result.find((r) => r.mes === "2026-01");
			expect(jan?.cantidad).toBe(2);
			expect(jan?.gastos).toBe(-5000);
			expect(jan?.ingresos).toBe(0);

			const feb = result.find((r) => r.mes === "2026-02");
			expect(feb?.cantidad).toBe(2);
			expect(feb?.gastos).toBe(-5000);
			expect(feb?.ingresos).toBe(10000);
		});

		it("returns empty array when no transactions in period", () => {
			const result = analyticsRepo.monthlyTrend(db, "2026-01-01", "2026-01-31");
			expect(result).toEqual([]);
		});
	});

	describe("pipelineStatus", () => {
		it("returns count of documents grouped by estado", () => {
			documentsRepo.create(db, {
				hash: "h1",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
			});
			documentsRepo.create(db, {
				hash: "h2",
				canal: "TELEGRAM",
				tipo: "VOUCHER",
				formato: "IMAGEN",
			});
			const processing = documentsRepo.create(db, {
				hash: "h3",
				canal: "EMAIL",
				tipo: "FACTURA",
				formato: "PDF",
			});
			documentsRepo.updateEstado(db, processing.id, "PROCESANDO");

			const result = analyticsRepo.pipelineStatus(db);

			const recibidoEntry = result.find((r) => r.estado === "RECIBIDO");
			const procesandoEntry = result.find((r) => r.estado === "PROCESANDO");

			expect(recibidoEntry?.cantidad).toBe(2);
			expect(procesandoEntry?.cantidad).toBe(1);
		});

		it("returns empty array when no documents exist", () => {
			const result = analyticsRepo.pipelineStatus(db);
			expect(result).toEqual([]);
		});
	});

	describe("debtEvolution", () => {
		it("returns debt records joined with product and entity info", () => {
			const entityId = createTestEntity(db, "BCP");
			const productId = createTestProduct(db, entityId);
			const docId = createTestDocument(db);

			statementsRepo.create(db, {
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

			const result = analyticsRepo.debtEvolution(db);

			expect(result).toHaveLength(1);
			expect(result[0].deuda_total).toBe(120000);
			expect(result[0].producto_id).toBe(productId);
			expect(result[0].entidad).toBe("BCP");
		});

		it("returns empty array when no statements exist", () => {
			const result = analyticsRepo.debtEvolution(db);
			expect(result).toEqual([]);
		});
	});

	describe("deductibleTotals", () => {
		it("aggregates deductible transactions by categoria_sunat for a given year", () => {
			const docId = createTestDocument(db);
			const catId = db.prepare(
				"INSERT INTO categoria (id, nombre, origen, es_deducible_sunat, categoria_sunat) VALUES ('cat-hotel', 'Hoteles', 'USUARIO_CREADA', 1, 'HOSPEDAJE')",
			).run() && "cat-hotel";

			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 8000,
				moneda: "PEN",
				comercio: "Hotel Lima",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
				es_deducible_ir: true,
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-06-20",
				monto: 12000,
				moneda: "PEN",
				comercio: "Hotel Arequipa",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
				es_deducible_ir: true,
			});

			const result = analyticsRepo.deductibleTotals(db, "2026");

			expect(result).toHaveLength(1);
			expect(result[0].categoria_sunat).toBe("HOSPEDAJE");
			expect(result[0].total).toBe(20000);
			expect(result[0].cantidad).toBe(2);
		});

		it("excludes non-deductible transactions", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db, "Transporte");

			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 3000,
				moneda: "PEN",
				comercio: "Uber",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
				es_deducible_ir: false,
			});

			const result = analyticsRepo.deductibleTotals(db, "2026");
			expect(result).toEqual([]);
		});
	});

	describe("topCommerces", () => {
		it("returns top commerces by spend in the period", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-10",
				monto: 1000,
				moneda: "PEN",
				comercio: "Starbucks",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-11",
				monto: 1000,
				moneda: "PEN",
				comercio: "Starbucks",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-12",
				monto: 500,
				moneda: "PEN",
				comercio: "Metro",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});

			const result = analyticsRepo.topCommerces(db, "2026-01-01", "2026-01-31");

			const starbucks = result.find((r) => r.comercio === "Starbucks");
			expect(starbucks?.veces).toBe(2);
			expect(starbucks?.total).toBe(2000);

			const metro = result.find((r) => r.comercio === "Metro");
			expect(metro?.veces).toBe(1);
		});

		it("respects the limit parameter", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			for (let i = 1; i <= 5; i++) {
				transactionsRepo.create(db, {
					documento_fuente_id: docId,
					fecha: "2026-01-15",
					monto: i * 100,
					moneda: "PEN",
					comercio: `Comercio ${i}`,
					categoria_id: catId,
					origen_categoria: "LLM_SUGERIDA",
					tipo_pago: "TARJETA",
				});
			}

			const result = analyticsRepo.topCommerces(
				db,
				"2026-01-01",
				"2026-01-31",
				3,
			);
			expect(result).toHaveLength(3);
		});
	});
});
