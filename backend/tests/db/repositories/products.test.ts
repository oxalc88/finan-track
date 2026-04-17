import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { createDb } from "../../../src/db/connection.js";
import { runMigrations } from "../../../src/db/schema.js";
import * as productsRepo from "../../../src/db/repositories/products.js";
import { createTestEntity } from "./helpers.js";

let db: Database.Database;

beforeEach(() => {
	db = createDb(":memory:");
	runMigrations(db);
});

const baseProductInput = {
	tipo: "VISA" as const,
	categoria_tarjeta: "GOLD" as const,
	linea_credito: 500000,
	moneda: "PEN" as const,
	fecha_corte: 15,
	fecha_pago: 10,
	tasa_interes: 2500,
	tipo_beneficio: "NINGUNO" as const,
	fecha_apertura: "2024-01-01",
};

describe("products repository", () => {
	describe("create", () => {
		it("returns product with activo = true", () => {
			const entityId = createTestEntity(db);
			const product = productsRepo.create(db, {
				entidad_financiera_id: entityId,
				...baseProductInput,
			});

			expect(product.id).toBeTruthy();
			expect(product.activo).toBe(true);
		});

		it("links product to entity", () => {
			const entityId = createTestEntity(db, "BCP");
			const product = productsRepo.create(db, {
				entidad_financiera_id: entityId,
				...baseProductInput,
			});

			expect(product.entidad_financiera_id).toBe(entityId);
		});

		it("stores all required fields", () => {
			const entityId = createTestEntity(db);
			const product = productsRepo.create(db, {
				entidad_financiera_id: entityId,
				...baseProductInput,
			});

			expect(product.tipo).toBe("VISA");
			expect(product.categoria_tarjeta).toBe("GOLD");
			expect(product.linea_credito).toBe(500000);
			expect(product.tasa_interes).toBe(2500);
		});

		it("can create inactive product when activo=false is provided", () => {
			const entityId = createTestEntity(db);
			const product = productsRepo.create(db, {
				entidad_financiera_id: entityId,
				...baseProductInput,
				activo: false,
			});

			expect(product.activo).toBe(false);
		});
	});

	describe("findAll", () => {
		it("returns only active products", () => {
			const entityId = createTestEntity(db);
			productsRepo.create(db, {
				entidad_financiera_id: entityId,
				...baseProductInput,
			});
			const inactive = productsRepo.create(db, {
				entidad_financiera_id: entityId,
				...baseProductInput,
				tipo: "MASTERCARD" as const,
				activo: false,
			});
			// Deactivate second one explicitly just to be sure
			productsRepo.deactivate(db, inactive.id);

			const result = productsRepo.findAll(db);
			expect(result.every((p) => p.activo === true)).toBe(true);
		});

		it("does not return deactivated products", () => {
			const entityId = createTestEntity(db);
			const product = productsRepo.create(db, {
				entidad_financiera_id: entityId,
				...baseProductInput,
			});
			productsRepo.deactivate(db, product.id);

			const result = productsRepo.findAll(db);
			expect(result).toHaveLength(0);
		});
	});

	describe("findAllIncludingInactive", () => {
		it("returns both active and inactive products", () => {
			const entityId = createTestEntity(db);
			productsRepo.create(db, {
				entidad_financiera_id: entityId,
				...baseProductInput,
			});
			const second = productsRepo.create(db, {
				entidad_financiera_id: entityId,
				...baseProductInput,
				tipo: "MASTERCARD" as const,
			});
			productsRepo.deactivate(db, second.id);

			const result = productsRepo.findAllIncludingInactive(db);
			expect(result).toHaveLength(2);
		});
	});

	describe("deactivate", () => {
		it("sets activo to false", () => {
			const entityId = createTestEntity(db);
			const product = productsRepo.create(db, {
				entidad_financiera_id: entityId,
				...baseProductInput,
			});

			const deactivated = productsRepo.deactivate(db, product.id);
			expect(deactivated?.activo).toBe(false);
		});

		it("sets actualizado_en", () => {
			const entityId = createTestEntity(db);
			const product = productsRepo.create(db, {
				entidad_financiera_id: entityId,
				...baseProductInput,
			});

			const deactivated = productsRepo.deactivate(db, product.id);
			expect(deactivated?.actualizado_en).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		});

		it("returns null for nonexistent id", () => {
			const result = productsRepo.deactivate(db, "ghost-id");
			expect(result).toBeNull();
		});
	});
});
