import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export function createDb(dbPath?: string): Database.Database {
	const resolved = dbPath ?? process.env.DB_PATH ?? "./db/finanzas.db";

	// `new Database()` will not create the enclosing directory — a fresh
	// checkout running `pnpm dev:api` before `pnpm db:migrate` would fail
	// with SQLITE_CANTOPEN. Skip for the in-memory sentinel.
	if (resolved !== ":memory:") {
		fs.mkdirSync(path.dirname(resolved), { recursive: true });
	}

	const db = new Database(resolved);

	db.pragma("journal_mode = WAL");
	db.pragma("foreign_keys = ON");
	db.pragma("busy_timeout = 5000");

	return db;
}
