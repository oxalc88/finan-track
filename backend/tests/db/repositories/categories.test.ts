import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { createDb } from "../../../src/db/connection.js";
import { runMigrations } from "../../../src/db/schema.js";
import * as categoriesRepo from "../../../src/db/repositories/categories.js";
import * as transactionsRepo from "../../../src/db/repositories/transactions.js";
import { createTestDocument } from "./helpers.js";

let db: Database.Database;

beforeEach(() => {
	db = createDb(":memory:");
	runMigrations(db);
});

describe("categories repository", () => {
	describe("create", () => {
		it("returns category with activa = true by default", () => {
			const category = categoriesRepo.create(db, {
				nombre: "Restaurantes",
				origen: "USUARIO_CREADA",
			});

			expect(category.id).toBeTruthy();
			expect(category.nombre).toBe("Restaurantes");
			expect(category.activa).toBe(true);
		});

		it("defaults es_deducible_sunat to false", () => {
			const category = categoriesRepo.create(db, {
				nombre: "Farmacia",
				origen: "USUARIO_CREADA",
			});

			expect(category.es_deducible_sunat).toBe(false);
		});

		it("stores optional fields when provided", () => {
			const category = categoriesRepo.create(db, {
				nombre: "Hoteles",
				origen: "LLM_SUGERIDA",
				descripcion: "Gastos de hospedaje",
				es_deducible_sunat: true,
				categoria_sunat: "HOSPEDAJE",
			});

			expect(category.descripcion).toBe("Gastos de hospedaje");
			expect(category.es_deducible_sunat).toBe(true);
			expect(category.categoria_sunat).toBe("HOSPEDAJE");
		});
	});

	describe("findAll", () => {
		it("returns only active non-merged categories", () => {
			categoriesRepo.create(db, { nombre: "Restaurantes", origen: "USUARIO_CREADA" });
			categoriesRepo.create(db, { nombre: "Comida", origen: "USUARIO_CREADA" });

			const result = categoriesRepo.findAll(db);
			expect(result).toHaveLength(2);
		});

		it("does not return inactive categories", () => {
			const active = categoriesRepo.create(db, {
				nombre: "Activa",
				origen: "USUARIO_CREADA",
			});
			categoriesRepo.create(db, {
				nombre: "Inactiva",
				origen: "USUARIO_CREADA",
				activa: false,
			});

			const result = categoriesRepo.findAll(db);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(active.id);
		});

		it("does not return merged categories", () => {
			const target = categoriesRepo.create(db, {
				nombre: "Comida",
				origen: "USUARIO_CREADA",
			});
			const source = categoriesRepo.create(db, {
				nombre: "Restaurantes",
				origen: "USUARIO_CREADA",
			});
			categoriesRepo.merge(db, source.id, target.id);

			const result = categoriesRepo.findAll(db);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(target.id);
		});
	});

	describe("findByNombre", () => {
		it("finds category by exact nombre", () => {
			categoriesRepo.create(db, { nombre: "Supermercados", origen: "USUARIO_CREADA" });

			const found = categoriesRepo.findByNombre(db, "Supermercados");
			expect(found).not.toBeNull();
			expect(found?.nombre).toBe("Supermercados");
		});

		it("finds category case-insensitively", () => {
			categoriesRepo.create(db, { nombre: "Supermercados", origen: "USUARIO_CREADA" });

			const found = categoriesRepo.findByNombre(db, "supermercados");
			expect(found).not.toBeNull();
			expect(found?.nombre).toBe("Supermercados");
		});

		it("returns null for nonexistent nombre", () => {
			const found = categoriesRepo.findByNombre(db, "Nonexistent");
			expect(found).toBeNull();
		});

		it("does not find merged categories by nombre", () => {
			const target = categoriesRepo.create(db, {
				nombre: "Comida",
				origen: "USUARIO_CREADA",
			});
			const source = categoriesRepo.create(db, {
				nombre: "Restaurantes",
				origen: "USUARIO_CREADA",
			});
			categoriesRepo.merge(db, source.id, target.id);

			const found = categoriesRepo.findByNombre(db, "Restaurantes");
			expect(found).toBeNull();
		});
	});

	describe("getActiveNames", () => {
		it("returns names of active non-merged categories", () => {
			categoriesRepo.create(db, { nombre: "Supermercados", origen: "USUARIO_CREADA" });
			categoriesRepo.create(db, { nombre: "Farmacia", origen: "USUARIO_CREADA" });

			const names = categoriesRepo.getActiveNames(db);
			expect(names).toContain("Supermercados");
			expect(names).toContain("Farmacia");
		});

		it("returns names ordered alphabetically", () => {
			categoriesRepo.create(db, { nombre: "Supermercados", origen: "USUARIO_CREADA" });
			categoriesRepo.create(db, { nombre: "Farmacia", origen: "USUARIO_CREADA" });

			const names = categoriesRepo.getActiveNames(db);
			expect(names[0]).toBe("Farmacia");
			expect(names[1]).toBe("Supermercados");
		});

		it("does not include inactive or merged categories in name list", () => {
			const target = categoriesRepo.create(db, {
				nombre: "Comida",
				origen: "USUARIO_CREADA",
			});
			const source = categoriesRepo.create(db, {
				nombre: "Restaurantes",
				origen: "USUARIO_CREADA",
			});
			categoriesRepo.merge(db, source.id, target.id);

			const names = categoriesRepo.getActiveNames(db);
			expect(names).not.toContain("Restaurantes");
			expect(names).toContain("Comida");
		});
	});

	describe("merge", () => {
		it("reassigns transactions from source to target category", () => {
			const docId = createTestDocument(db);
			const sourceCategory = categoriesRepo.create(db, {
				nombre: "Restaurantes",
				origen: "USUARIO_CREADA",
			});
			const targetCategory = categoriesRepo.create(db, {
				nombre: "Comida",
				origen: "USUARIO_CREADA",
			});

			const tx = transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 5000,
				moneda: "PEN",
				comercio: "El Rincon",
				categoria_id: sourceCategory.id,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});

			categoriesRepo.merge(db, sourceCategory.id, targetCategory.id);

			const updated = transactionsRepo.findById(db, tx.id);
			expect(updated?.categoria_id).toBe(targetCategory.id);
		});

		it("marks the source category as merged and inactive", () => {
			const sourceCategory = categoriesRepo.create(db, {
				nombre: "Restaurantes",
				origen: "USUARIO_CREADA",
			});
			const targetCategory = categoriesRepo.create(db, {
				nombre: "Comida",
				origen: "USUARIO_CREADA",
			});

			categoriesRepo.merge(db, sourceCategory.id, targetCategory.id);

			const source = categoriesRepo.findById(db, sourceCategory.id);
			expect(source?.activa).toBe(false);
			expect(source?.mergeada_en_id).toBe(targetCategory.id);
		});

		it("returns the count of transactions reassigned", () => {
			const docId = createTestDocument(db);
			const sourceCategory = categoriesRepo.create(db, {
				nombre: "Restaurantes",
				origen: "USUARIO_CREADA",
			});
			const targetCategory = categoriesRepo.create(db, {
				nombre: "Comida",
				origen: "USUARIO_CREADA",
			});

			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-15",
				monto: 5000,
				moneda: "PEN",
				comercio: "El Rincon",
				categoria_id: sourceCategory.id,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "TARJETA",
			});
			transactionsRepo.create(db, {
				documento_fuente_id: docId,
				fecha: "2026-01-16",
				monto: 3000,
				moneda: "PEN",
				comercio: "La Picanteria",
				categoria_id: sourceCategory.id,
				origen_categoria: "LLM_SUGERIDA",
				tipo_pago: "EFECTIVO",
			});

			const count = categoriesRepo.merge(db, sourceCategory.id, targetCategory.id);
			expect(count).toBe(2);
		});
	});
});
