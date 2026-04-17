import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { createDb } from "../../../src/db/connection.js";
import { runMigrations } from "../../../src/db/schema.js";
import * as transactionsRepo from "../../../src/db/repositories/transactions.js";
import * as categoriesRepo from "../../../src/db/repositories/categories.js";
import { createTestDocument, createTestCategory } from "./helpers.js";

let db: Database.Database;

beforeEach(() => {
	db = createDb(":memory:");
	runMigrations(db);
});

describe("transactions repository", () => {
	describe("create", () => {
		it("returns transaction linked to document with required fields", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db, "Restaurantes");

			const tx = transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 5000,
				moneda: "PEN",
				comercio: "El Rincon",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});

			expect(tx.id).toBeTruthy();
			expect(tx.documento_fuente_id).toBe(docId);
			expect(tx.monto).toBe(5000);
			expect(tx.moneda).toBe("PEN");
			expect(tx.comercio).toBe("El Rincon");
		});

		it("defaults es_deducible_ir to false", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			const tx = transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 3000,
				moneda: "PEN",
				comercio: "Farmacia",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "EFECTIVO",
			});

			expect(tx.es_deducible_ir).toBe(false);
		});

		it("stores es_deducible_ir = true when provided", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			const tx = transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 8000,
				moneda: "PEN",
				comercio: "Hotel Miraflores",
				categoria_id: catId,
				origen_categoria: "USUARIO_CORREGIDA",
				tipo_pago: "TARJETA",
				es_deducible_ir: true,
			});

			expect(tx.es_deducible_ir).toBe(true);
		});
	});

	describe("findAll with filters", () => {
		it("returns all transactions when no filter is applied", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 1000,
				moneda: "PEN",
				comercio: "A",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-02-10",
				monto: 2000,
				moneda: "PEN",
				comercio: "B",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "EFECTIVO",
			});

			const { data, total } = transactionsRepo.findAll(db);
			expect(total).toBe(2);
			expect(data).toHaveLength(2);
		});

		it("filters by periodo_inicio and periodo_fin", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 1000,
				moneda: "PEN",
				comercio: "Jan",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-03-20",
				monto: 2000,
				moneda: "PEN",
				comercio: "Mar",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});

			const { data, total } = transactionsRepo.findAll(db, {
				periodo_inicio: "2026-01-01",
				periodo_fin: "2026-01-31",
			});

			expect(total).toBe(1);
			expect(data[0].comercio).toBe("Jan");
		});

		it("filters by categoria", () => {
			const docId = createTestDocument(db);
			const catA = createTestCategory(db, "Restaurantes");
			const catB = createTestCategory(db, "Farmacia");

			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 1000,
				moneda: "PEN",
				comercio: "Comida",
				categoria_id: catA,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 500,
				moneda: "PEN",
				comercio: "Botica",
				categoria_id: catB,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "EFECTIVO",
			});

			const { data, total } = transactionsRepo.findAll(db, {
				categorias: [catA],
			});
			expect(total).toBe(1);
			expect(data[0].categoria_id).toBe(catA);
		});

		it("filters by monto_minimo and monto_maximo", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 500,
				moneda: "PEN",
				comercio: "Cheap",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "EFECTIVO",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 10000,
				moneda: "PEN",
				comercio: "Expensive",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});

			const { data, total } = transactionsRepo.findAll(db, {
				monto_minimo: 1000,
				monto_maximo: 50000,
			});
			expect(total).toBe(1);
			expect(data[0].comercio).toBe("Expensive");
		});

		it("filters by comercio using partial match", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 1000,
				moneda: "PEN",
				comercio: "Starbucks Miraflores",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 2000,
				moneda: "PEN",
				comercio: "Metro Supermercado",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});

			const { data, total } = transactionsRepo.findAll(db, {
				comercio: "Starbucks",
			});
			expect(total).toBe(1);
			expect(data[0].comercio).toContain("Starbucks");
		});

		it("filters by es_deducible_ir", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 1000,
				moneda: "PEN",
				comercio: "Hotel",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
				es_deducible_ir: true,
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 500,
				moneda: "PEN",
				comercio: "Taxi",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "EFECTIVO",
				es_deducible_ir: false,
			});

			const { data, total } = transactionsRepo.findAll(db, {
				es_deducible_ir: true,
			});
			expect(total).toBe(1);
			expect(data[0].comercio).toBe("Hotel");
		});
	});

	describe("findAll pagination", () => {
		it("respects limit and returns correct total", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			for (let i = 1; i <= 5; i++) {
				transactionsRepo.create(db, {
					documento_fuente_id: docId,
					fecha: `2026-01-${String(i).padStart(2, "0")}`,
					monto: i * 1000,
					moneda: "PEN",
					comercio: `Comercio ${i}`,
					categoria_id: catId,
					origen_categoria: "LLM_SUGERIDA",
					tipo_pago: "TARJETA",
				});
			}

			const { data, total } = transactionsRepo.findAll(db, { limit: 3 });
			expect(total).toBe(5);
			expect(data).toHaveLength(3);
		});

		it("respects offset", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			for (let i = 1; i <= 4; i++) {
				transactionsRepo.create(db, {
					documento_fuente_id: docId,
					fecha: `2026-01-${String(i).padStart(2, "0")}`,
					monto: i * 1000,
					moneda: "PEN",
					comercio: `Shop ${i}`,
					categoria_id: catId,
					origen_categoria: "LLM_SUGERIDA",
					tipo_pago: "TARJETA",
				});
			}

			const first = transactionsRepo.findAll(db, { limit: 2, offset: 0 });
			const second = transactionsRepo.findAll(db, { limit: 2, offset: 2 });

			expect(first.data).toHaveLength(2);
			expect(second.data).toHaveLength(2);
			// No overlap between pages
			const firstIds = first.data.map((t) => t.id);
			const secondIds = second.data.map((t) => t.id);
			expect(firstIds.some((id) => secondIds.includes(id))).toBe(false);
		});
	});

	describe("updateCategory", () => {
		it("changes category and origen_categoria", () => {
			const docId = createTestDocument(db);
			const catA = createTestCategory(db, "Restaurantes");
			const catB = createTestCategory(db, "Comida");

			const tx = transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 5000,
				moneda: "PEN",
				comercio: "El Rincon",
				categoria_id: catA,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});

			const updated = transactionsRepo.updateCategory(
				db,
				tx.id,
				catB,
				"USUARIO_CORREGIDA",
			);

			expect(updated?.categoria_id).toBe(catB);
			expect(updated?.origen_categoria).toBe("USUARIO_CORREGIDA");
		});
	});

	describe("markDeductible", () => {
		it("sets es_deducible_ir to true", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			const tx = transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 5000,
				moneda: "PEN",
				comercio: "Hotel Lima",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});

			const updated = transactionsRepo.markDeductible(db, tx.id, true);
			expect(updated?.es_deducible_ir).toBe(true);
		});

		it("sets es_deducible_ir to false", () => {
			const docId = createTestDocument(db);
			const catId = createTestCategory(db);

			const tx = transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 5000,
				moneda: "PEN",
				comercio: "Hotel Lima",
				categoria_id: catId,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
				es_deducible_ir: true,
			});

			const updated = transactionsRepo.markDeductible(db, tx.id, false);
			expect(updated?.es_deducible_ir).toBe(false);
		});
	});

	describe("bulkUpdateCategory", () => {
		it("updates all transactions from one category to another", () => {
			const docId = createTestDocument(db);
			const catA = createTestCategory(db, "Restaurantes");
			const catB = createTestCategory(db, "Comida");

			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 1000,
				moneda: "PEN",
				comercio: "A",
				categoria_id: catA,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-16",
				monto: 2000,
				moneda: "PEN",
				comercio: "B",
				categoria_id: catA,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "EFECTIVO",
			});

			const count = transactionsRepo.bulkUpdateCategory(db, catA, catB);
			expect(count).toBe(2);

			const { data } = transactionsRepo.findAll(db, { categorias: [catB] });
			expect(data).toHaveLength(2);
		});

		it("returns 0 when no transactions match source category", () => {
			const catA = createTestCategory(db, "Empty Cat");
			const catB = createTestCategory(db, "Target");

			const count = transactionsRepo.bulkUpdateCategory(db, catA, catB);
			expect(count).toBe(0);
		});
	});
});
