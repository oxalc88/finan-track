import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { createDb } from "../../../src/db/connection.js";
import { runMigrations } from "../../../src/db/schema.js";
import * as accountsRepo from "../../../src/db/repositories/accounts.js";
import { createTestEntity } from "./helpers.js";

let db: Database.Database;

beforeEach(() => {
	db = createDb(":memory:");
	runMigrations(db);
});

describe("accounts repository", () => {
	describe("create", () => {
		it("returns account linked to entity with required fields", () => {
			const entityId = createTestEntity(db, "BCP");
			const account = accountsRepo.create(db, {
				entidad_financiera_id: entityId,
				tipo: "AHORRO",
				moneda: "PEN",
			});

			expect(account.id).toBeTruthy();
			expect(account.entidad_financiera_id).toBe(entityId);
			expect(account.tipo).toBe("AHORRO");
			expect(account.moneda).toBe("PEN");
		});

		it("defaults saldo to 0 when not provided", () => {
			const entityId = createTestEntity(db);
			const account = accountsRepo.create(db, {
				entidad_financiera_id: entityId,
				tipo: "CORRIENTE",
				moneda: "USD",
			});

			expect(account.saldo).toBe(0);
		});

		it("stores provided saldo, tasa_interes, and proposito", () => {
			const entityId = createTestEntity(db);
			const account = accountsRepo.create(db, {
				entidad_financiera_id: entityId,
				tipo: "CTS",
				moneda: "PEN",
				saldo: 15000,
				tasa_interes: 350,
				proposito: "Emergencias",
			});

			expect(account.saldo).toBe(15000);
			expect(account.tasa_interes).toBe(350);
			expect(account.proposito).toBe("Emergencias");
		});
	});

	describe("findByEntidad", () => {
		it("returns accounts for the given entity", () => {
			const entityId = createTestEntity(db, "BCP");
			accountsRepo.create(db, {
				entidad_financiera_id: entityId,
				tipo: "AHORRO",
				moneda: "PEN",
			});
			accountsRepo.create(db, {
				entidad_financiera_id: entityId,
				tipo: "CTS",
				moneda: "PEN",
			});

			const result = accountsRepo.findByEntidad(db, entityId);
			expect(result).toHaveLength(2);
			expect(result.every((a) => a.entidad_financiera_id === entityId)).toBe(
				true,
			);
		});

		it("does not return accounts from other entities", () => {
			const entityA = createTestEntity(db, "BCP");
			const entityB = createTestEntity(db, "BBVA");

			accountsRepo.create(db, {
				entidad_financiera_id: entityA,
				tipo: "AHORRO",
				moneda: "PEN",
			});
			accountsRepo.create(db, {
				entidad_financiera_id: entityB,
				tipo: "CORRIENTE",
				moneda: "PEN",
			});

			const resultA = accountsRepo.findByEntidad(db, entityA);
			expect(resultA).toHaveLength(1);
			expect(resultA[0].entidad_financiera_id).toBe(entityA);
		});

		it("returns empty array when entity has no accounts", () => {
			const entityId = createTestEntity(db);
			const result = accountsRepo.findByEntidad(db, entityId);
			expect(result).toEqual([]);
		});
	});

	describe("updateBalance", () => {
		it("updates saldo and sets saldo_actualizado_en", () => {
			const entityId = createTestEntity(db);
			const account = accountsRepo.create(db, {
				entidad_financiera_id: entityId,
				tipo: "AHORRO",
				moneda: "PEN",
				saldo: 1000,
			});

			const updated = accountsRepo.updateBalance(db, account.id, 9500);

			expect(updated?.saldo).toBe(9500);
			expect(updated?.saldo_actualizado_en).toBeTruthy();
			expect(updated?.saldo_actualizado_en).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		});

		it("returns null for nonexistent id", () => {
			const result = accountsRepo.updateBalance(db, "ghost-id", 5000);
			// updateBalance returns findById which returns null for unknown id
			expect(result).toBeNull();
		});

		it("updates actualizado_en as well", () => {
			const entityId = createTestEntity(db);
			const account = accountsRepo.create(db, {
				entidad_financiera_id: entityId,
				tipo: "AHORRO",
				moneda: "PEN",
			});

			const updated = accountsRepo.updateBalance(db, account.id, 200);
			expect(updated?.actualizado_en).toBeTruthy();
		});
	});
});
