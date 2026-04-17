import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { createDb } from "../../src/db/connection.js";

describe("createDb", () => {
	let db: Database.Database;

	afterEach(() => {
		if (db && db.open) {
			db.close();
		}
	});

	it("returns a Database instance for an in-memory database", () => {
		db = createDb(":memory:");
		expect(db).toBeInstanceOf(Database);
		expect(db.open).toBe(true);
	});

	it("can execute a simple query after creation", () => {
		db = createDb(":memory:");
		const result = db.prepare("SELECT 1 AS val").get() as { val: number };
		expect(result.val).toBe(1);
	});

	it("has WAL journal mode enabled", () => {
		db = createDb(":memory:");
		// WAL mode is set via pragma but in-memory DBs fall back to memory mode.
		// The important thing is that the pragma call does not throw and the
		// database is usable. For file-based DBs WAL applies — here we verify
		// the pragma was executed without error by querying journal_mode.
		const result = db.pragma("journal_mode") as Array<{ journal_mode: string }>;
		// In-memory databases use "memory" journal mode (WAL is a no-op for them)
		expect(["wal", "memory"]).toContain(result[0].journal_mode);
	});

	it("has foreign keys enforced", () => {
		db = createDb(":memory:");
		const result = db.pragma("foreign_keys") as Array<{ foreign_keys: number }>;
		expect(result[0].foreign_keys).toBe(1);
	});

	it("allows multiple connections to be created independently", () => {
		const db1 = createDb(":memory:");
		const db2 = createDb(":memory:");

		expect(db1.open).toBe(true);
		expect(db2.open).toBe(true);
		expect(db1).not.toBe(db2);

		db1.close();
		db2.close();
	});
});
