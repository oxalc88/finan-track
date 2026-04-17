import fs from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";
import { createDb } from "./connection.js";

export function runMigrations(db: Database.Database): void {
  const currentVersion = db.pragma("user_version", { simple: true }) as number;

  const migrationsDir = path.join(import.meta.dirname, "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const version = parseInt(file.split("_")[0], 10);
    if (version <= currentVersion) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.pragma(`user_version = ${version}`);
      db.exec("COMMIT");
      console.log(`Migration ${file} applied (version ${version})`);
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const dbPath = process.env.DB_PATH ?? "./db/finanzas.db";
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = createDb(dbPath);
  runMigrations(db);
  db.close();
  console.log("Migrations complete.");
}
