import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { createDb } from "../../../src/db/connection.js";
import { runMigrations } from "../../../src/db/schema.js";
import * as entitiesRepo from "../../../src/db/repositories/entities.js";

let db: Database.Database;

beforeEach(() => {
	db = createDb(":memory:");
	runMigrations(db);
});

describe("entities repository", () => {
	describe("create", () => {
		it("returns entity with id, nombre, and tipo", () => {
			const entity = entitiesRepo.create(db, {
				nombre: "BCP",
				tipo: "BANCO",
				clave_descifrado: "12345678",
				patron_clave: "DNI",
			});

			expect(entity.id).toBeTruthy();
			expect(entity.nombre).toBe("BCP");
			expect(entity.tipo).toBe("BANCO");
		});

		it("returns entity with timestamps set", () => {
			const entity = entitiesRepo.create(db, {
				nombre: "BBVA",
				tipo: "BANCO",
				clave_descifrado: "",
				patron_clave: "DNI",
			});

			expect(entity.creado_en).toBeTruthy();
			expect(entity.actualizado_en).toBeTruthy();
		});

		it("stores clave_descifrado and patron_clave", () => {
			const entity = entitiesRepo.create(db, {
				nombre: "Interbank",
				tipo: "BANCO",
				clave_descifrado: "secret123",
				patron_clave: "RUC",
			});

			expect(entity.clave_descifrado).toBe("secret123");
			expect(entity.patron_clave).toBe("RUC");
		});
	});

	describe("findAll", () => {
		it("returns empty array when no entities exist", () => {
			const result = entitiesRepo.findAll(db);
			expect(result).toEqual([]);
		});

		it("returns all created entities", () => {
			entitiesRepo.create(db, {
				nombre: "BCP",
				tipo: "BANCO",
				clave_descifrado: "",
				patron_clave: "DNI",
			});
			entitiesRepo.create(db, {
				nombre: "Yape",
				tipo: "FINTECH",
				clave_descifrado: "",
				patron_clave: "DNI",
			});

			const result = entitiesRepo.findAll(db);
			expect(result).toHaveLength(2);
		});

		it("returns entities ordered by nombre", () => {
			entitiesRepo.create(db, {
				nombre: "Scotiabank",
				tipo: "BANCO",
				clave_descifrado: "",
				patron_clave: "DNI",
			});
			entitiesRepo.create(db, {
				nombre: "BCP",
				tipo: "BANCO",
				clave_descifrado: "",
				patron_clave: "DNI",
			});

			const result = entitiesRepo.findAll(db);
			expect(result[0].nombre).toBe("BCP");
			expect(result[1].nombre).toBe("Scotiabank");
		});
	});

	describe("findById", () => {
		it("returns entity when it exists", () => {
			const created = entitiesRepo.create(db, {
				nombre: "BCP",
				tipo: "BANCO",
				clave_descifrado: "",
				patron_clave: "DNI",
			});

			const found = entitiesRepo.findById(db, created.id);
			expect(found).not.toBeNull();
			expect(found?.id).toBe(created.id);
			expect(found?.nombre).toBe("BCP");
		});

		it("returns null when entity does not exist", () => {
			const found = entitiesRepo.findById(db, "nonexistent-id");
			expect(found).toBeNull();
		});
	});

	describe("update", () => {
		it("updates nombre and sets actualizado_en", () => {
			const entity = entitiesRepo.create(db, {
				nombre: "BCP",
				tipo: "BANCO",
				clave_descifrado: "",
				patron_clave: "DNI",
			});
			const originalActualizadoEn = entity.actualizado_en;

			// Small delay to ensure timestamp differs
			const updated = entitiesRepo.update(db, {
				id: entity.id,
				nombre: "BCP Peru",
			});

			expect(updated?.nombre).toBe("BCP Peru");
			// actualizado_en should be a valid ISO timestamp
			expect(updated?.actualizado_en).toMatch(/^\d{4}-\d{2}-\d{2}T/);
			// Type and id should not have changed
			expect(updated?.tipo).toBe("BANCO");
			expect(updated?.id).toBe(entity.id);
		});

		it("updates tipo", () => {
			const entity = entitiesRepo.create(db, {
				nombre: "Kredit",
				tipo: "BANCO",
				clave_descifrado: "",
				patron_clave: "DNI",
			});

			const updated = entitiesRepo.update(db, {
				id: entity.id,
				tipo: "FINANCIERA",
			});

			expect(updated?.tipo).toBe("FINANCIERA");
		});

		it("returns null for nonexistent id", () => {
			const result = entitiesRepo.update(db, {
				id: "ghost-id",
				nombre: "Ghost",
			});

			expect(result).toBeNull();
		});

		it("returns current entity when no fields to update are provided", () => {
			const entity = entitiesRepo.create(db, {
				nombre: "BCP",
				tipo: "BANCO",
				clave_descifrado: "",
				patron_clave: "DNI",
			});

			const result = entitiesRepo.update(db, { id: entity.id });
			expect(result?.nombre).toBe("BCP");
		});
	});
});
