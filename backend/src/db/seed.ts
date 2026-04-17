import { ulid } from "ulid";
import type Database from "better-sqlite3";
import { createDb } from "./connection.js";
import { runMigrations } from "./schema.js";

export function seedDefaultData(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO entidad_financiera (id, nombre, tipo, clave_descifrado, patron_clave)
    VALUES (?, ?, ?, '', 'DNI')
  `);

  const banks = [
    { nombre: "BCP", tipo: "BANCO" },
    { nombre: "BBVA", tipo: "BANCO" },
    { nombre: "IO", tipo: "FINTECH" },
    { nombre: "Interbank", tipo: "BANCO" },
    { nombre: "Scotiabank", tipo: "BANCO" },
  ];

  const insertAll = db.transaction(() => {
    for (const bank of banks) {
      insert.run(ulid(), bank.nombre, bank.tipo);
    }
  });

  insertAll();
  console.log(`Seeded ${banks.length} financial entities.`);
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const db = createDb();
  runMigrations(db);
  seedDefaultData(db);
  db.close();
}
