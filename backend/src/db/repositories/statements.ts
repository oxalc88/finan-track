import type Database from "better-sqlite3";
import { ulid } from "ulid";
import type {
	CreateResumenEstadoCuentaInput,
	ResumenEstadoCuenta,
} from "../../domain/types.js";

function mapRow(row: Record<string, unknown>): ResumenEstadoCuenta {
	return row as unknown as ResumenEstadoCuenta;
}

export function findAll(db: Database.Database): ResumenEstadoCuenta[] {
	const stmt = db.prepare(
		"SELECT * FROM resumen_estado_cuenta ORDER BY periodo_fin DESC",
	);
	return (stmt.all() as Record<string, unknown>[]).map(mapRow);
}

export function findById(
	db: Database.Database,
	id: string,
): ResumenEstadoCuenta | null {
	const stmt = db.prepare("SELECT * FROM resumen_estado_cuenta WHERE id = ?");
	const row = stmt.get(id) as Record<string, unknown> | undefined;
	return row ? mapRow(row) : null;
}

export function findByProducto(
	db: Database.Database,
	productoCreditoId: string,
): ResumenEstadoCuenta[] {
	const stmt = db.prepare(
		"SELECT * FROM resumen_estado_cuenta WHERE producto_credito_id = ? ORDER BY periodo_fin DESC",
	);
	return (stmt.all(productoCreditoId) as Record<string, unknown>[]).map(
		mapRow,
	);
}

export function create(
	db: Database.Database,
	input: CreateResumenEstadoCuentaInput,
): ResumenEstadoCuenta {
	const id = ulid();
	const stmt = db.prepare(`
		INSERT INTO resumen_estado_cuenta (
			id, documento_fuente_id, producto_credito_id, periodo_inicio,
			periodo_fin, fecha_pago, deuda_total, pago_minimo,
			linea_disponible, moneda, cantidad_transacciones
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);
	stmt.run(
		id,
		input.documento_fuente_id,
		input.producto_credito_id,
		input.periodo_inicio,
		input.periodo_fin,
		input.fecha_pago,
		input.deuda_total,
		input.pago_minimo,
		input.linea_disponible ?? null,
		input.moneda,
		input.cantidad_transacciones,
	);

	return findById(db, id) as ResumenEstadoCuenta;
}

export function findByProductoAndPeriodo(
	db: Database.Database,
	productoCreditoId: string,
	periodoInicio: string,
	periodoFin: string,
): ResumenEstadoCuenta | null {
	const stmt = db.prepare(
		"SELECT * FROM resumen_estado_cuenta WHERE producto_credito_id = ? AND periodo_inicio = ? AND periodo_fin = ?",
	);
	const row = stmt.get(productoCreditoId, periodoInicio, periodoFin) as
		| Record<string, unknown>
		| undefined;
	return row ? mapRow(row) : null;
}
