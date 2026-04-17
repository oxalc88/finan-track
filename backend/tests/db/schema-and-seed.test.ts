import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { createDb } from "../../src/db/connection.js";
import { runMigrations } from "../../src/db/schema.js";
import { seedDefaultData } from "../../src/db/seed.js";

// Helper: query sqlite_master for a table name
function tableExists(db: Database.Database, name: string): boolean {
	const row = db
		.prepare(
			"SELECT name FROM sqlite_master WHERE type='table' AND name=?",
		)
		.get(name) as { name: string } | undefined;
	return row !== undefined;
}

describe("runMigrations", () => {
	let db: Database.Database;

	beforeEach(() => {
		db = createDb(":memory:");
	});

	afterEach(() => {
		if (db.open) {
			db.close();
		}
	});

	it("creates the entidad_financiera table", () => {
		runMigrations(db);
		expect(tableExists(db, "entidad_financiera")).toBe(true);
	});

	it("creates the cuenta_deposito table", () => {
		runMigrations(db);
		expect(tableExists(db, "cuenta_deposito")).toBe(true);
	});

	it("creates the producto_credito table", () => {
		runMigrations(db);
		expect(tableExists(db, "producto_credito")).toBe(true);
	});

	it("creates the categoria table", () => {
		runMigrations(db);
		expect(tableExists(db, "categoria")).toBe(true);
	});

	it("creates the lote table", () => {
		runMigrations(db);
		expect(tableExists(db, "lote")).toBe(true);
	});

	it("creates the documento_fuente table", () => {
		runMigrations(db);
		expect(tableExists(db, "documento_fuente")).toBe(true);
	});

	it("creates the transaccion table", () => {
		runMigrations(db);
		expect(tableExists(db, "transaccion")).toBe(true);
	});

	it("creates the resumen_estado_cuenta table", () => {
		runMigrations(db);
		expect(tableExists(db, "resumen_estado_cuenta")).toBe(true);
	});

	it("creates the conciliacion table", () => {
		runMigrations(db);
		expect(tableExists(db, "conciliacion")).toBe(true);
	});

	it("creates the match_conciliacion table", () => {
		runMigrations(db);
		expect(tableExists(db, "match_conciliacion")).toBe(true);
	});

	it("creates the discrepancia table", () => {
		runMigrations(db);
		expect(tableExists(db, "discrepancia")).toBe(true);
	});

	it("advances user_version to the migration number", () => {
		runMigrations(db);
		const version = db.pragma("user_version", { simple: true }) as number;
		expect(version).toBe(1);
	});

	it("is idempotent — running twice does not throw", () => {
		runMigrations(db);
		expect(() => runMigrations(db)).not.toThrow();
	});

	it("remains at the same user_version after a second run", () => {
		runMigrations(db);
		runMigrations(db);
		const version = db.pragma("user_version", { simple: true }) as number;
		expect(version).toBe(1);
	});
});

describe("seedDefaultData", () => {
	let db: Database.Database;

	beforeEach(() => {
		db = createDb(":memory:");
		runMigrations(db);
	});

	afterEach(() => {
		if (db.open) {
			db.close();
		}
	});

	it("inserts exactly 5 financial entities", () => {
		seedDefaultData(db);
		const result = db
			.prepare("SELECT COUNT(*) AS cnt FROM entidad_financiera")
			.get() as { cnt: number };
		expect(result.cnt).toBe(5);
	});

	it("inserts BCP as a BANCO", () => {
		seedDefaultData(db);
		const row = db
			.prepare(
				"SELECT tipo FROM entidad_financiera WHERE nombre = 'BCP'",
			)
			.get() as { tipo: string } | undefined;
		expect(row).toBeDefined();
		expect(row?.tipo).toBe("BANCO");
	});

	it("inserts IO as a FINTECH", () => {
		seedDefaultData(db);
		const row = db
			.prepare(
				"SELECT tipo FROM entidad_financiera WHERE nombre = 'IO'",
			)
			.get() as { tipo: string } | undefined;
		expect(row).toBeDefined();
		expect(row?.tipo).toBe("FINTECH");
	});

	it("inserts all five expected entities by name", () => {
		seedDefaultData(db);
		const rows = db
			.prepare(
				"SELECT nombre FROM entidad_financiera ORDER BY nombre",
			)
			.all() as Array<{ nombre: string }>;
		const names = rows.map((r) => r.nombre).sort();
		expect(names).toEqual(["BBVA", "BCP", "Interbank", "IO", "Scotiabank"].sort());
	});

	it("is idempotent — running twice does not duplicate rows (INSERT OR IGNORE)", () => {
		seedDefaultData(db);
		seedDefaultData(db);
		const result = db
			.prepare("SELECT COUNT(*) AS cnt FROM entidad_financiera")
			.get() as { cnt: number };
		expect(result.cnt).toBe(5);
	});
});
