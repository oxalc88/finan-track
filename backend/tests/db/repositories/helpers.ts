import { ulid } from "ulid";
import type Database from "better-sqlite3";

export function createTestEntity(
	db: Database.Database,
	nombre = "Test Bank",
): string {
	const id = ulid();
	db.prepare(
		"INSERT INTO entidad_financiera (id, nombre, tipo) VALUES (?, ?, 'BANCO')",
	).run(id, nombre);
	return id;
}

export function createTestCategory(
	db: Database.Database,
	nombre = "Test Category",
): string {
	const id = ulid();
	db.prepare(
		"INSERT INTO categoria (id, nombre, origen) VALUES (?, ?, 'USUARIO_CREADA')",
	).run(id, nombre);
	return id;
}

export function createTestDocument(
	db: Database.Database,
	hash?: string,
): string {
	const id = ulid();
	db.prepare(
		"INSERT INTO documento_fuente (id, hash, canal, tipo, formato) VALUES (?, ?, 'TELEGRAM', 'VOUCHER', 'IMAGEN')",
	).run(id, hash ?? ulid());
	return id;
}

export function createTestProduct(
	db: Database.Database,
	entidadId: string,
): string {
	const id = ulid();
	db.prepare(`
		INSERT INTO producto_credito (
			id, entidad_financiera_id, tipo, categoria_tarjeta,
			linea_credito, moneda, fecha_corte, fecha_pago,
			tasa_interes, tipo_beneficio, fecha_apertura
		) VALUES (?, ?, 'VISA', 'GOLD', 500000, 'PEN', 15, 10, 2500, 'NINGUNO', '2024-01-01')
	`).run(id, entidadId);
	return id;
}

export function createTestAccount(
	db: Database.Database,
	entidadId: string,
): string {
	const id = ulid();
	db.prepare(
		"INSERT INTO cuenta_deposito (id, entidad_financiera_id, tipo, moneda) VALUES (?, ?, 'AHORRO', 'PEN')",
	).run(id, entidadId);
	return id;
}
