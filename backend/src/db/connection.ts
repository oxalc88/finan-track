import Database from "better-sqlite3";

export function createDb(path?: string): Database.Database {
  const dbPath = path ?? process.env.DB_PATH ?? "./db/finanzas.db";
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  return db;
}
