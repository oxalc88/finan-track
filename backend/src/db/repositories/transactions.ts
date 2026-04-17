import type Database from "better-sqlite3";
import { ulid } from "ulid";
import type {
	CreateTransaccionInput,
	OrigenCategoria,
	Transaccion,
	TransactionFilter,
} from "../../domain/types.js";

function mapRow(row: Record<string, unknown>): Transaccion {
	return {
		...row,
		es_deducible_ir: Boolean(row.es_deducible_ir),
	} as Transaccion;
}

export function findAll(
	db: Database.Database,
	filter: TransactionFilter = {},
): { data: Transaccion[]; total: number } {
	const conditions: string[] = [];
	const params: unknown[] = [];

	if (filter.periodo_inicio) {
		conditions.push("t.fecha >= ?");
		params.push(filter.periodo_inicio);
	}
	if (filter.periodo_fin) {
		conditions.push("t.fecha <= ?");
		params.push(filter.periodo_fin);
	}
	if (filter.categorias?.length) {
		conditions.push(
			`t.categoria_id IN (${filter.categorias.map(() => "?").join(",")})`,
		);
		params.push(...filter.categorias);
	}
	if (filter.cuentas?.length) {
		conditions.push(
			`t.cuenta_deposito_id IN (${filter.cuentas.map(() => "?").join(",")})`,
		);
		params.push(...filter.cuentas);
	}
	if (filter.productos?.length) {
		conditions.push(
			`t.producto_credito_id IN (${filter.productos.map(() => "?").join(",")})`,
		);
		params.push(...filter.productos);
	}
	if (filter.tipo_pago) {
		conditions.push("t.tipo_pago = ?");
		params.push(filter.tipo_pago);
	}
	if (filter.monto_minimo !== undefined) {
		conditions.push("t.monto >= ?");
		params.push(filter.monto_minimo);
	}
	if (filter.monto_maximo !== undefined) {
		conditions.push("t.monto <= ?");
		params.push(filter.monto_maximo);
	}
	if (filter.moneda) {
		conditions.push("t.moneda = ?");
		params.push(filter.moneda);
	}
	if (filter.es_deducible_ir !== undefined) {
		conditions.push("t.es_deducible_ir = ?");
		params.push(filter.es_deducible_ir ? 1 : 0);
	}
	if (filter.comercio) {
		conditions.push("t.comercio LIKE ?");
		params.push(`%${filter.comercio}%`);
	}

	const whereClause =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

	const countStmt = db.prepare(
		`SELECT COUNT(*) as total FROM transaccion t ${whereClause}`,
	);
	const { total } = countStmt.get(...params) as { total: number };

	const limit = Math.min(filter.limit ?? 50, 500);
	const offset = filter.offset ?? 0;

	const dataStmt = db.prepare(
		`SELECT t.* FROM transaccion t ${whereClause} ORDER BY t.fecha DESC, t.creado_en DESC LIMIT ? OFFSET ?`,
	);
	const rows = dataStmt.all(...params, limit, offset) as Record<
		string,
		unknown
	>[];

	return { data: rows.map(mapRow), total };
}

export function findById(
	db: Database.Database,
	id: string,
): Transaccion | null {
	const stmt = db.prepare("SELECT * FROM transaccion WHERE id = ?");
	const row = stmt.get(id) as Record<string, unknown> | undefined;
	return row ? mapRow(row) : null;
}

export function findByDocumento(
	db: Database.Database,
	documentoFuenteId: string,
): Transaccion[] {
	const stmt = db.prepare(
		"SELECT * FROM transaccion WHERE documento_fuente_id = ? ORDER BY fecha DESC, creado_en DESC",
	);
	return (stmt.all(documentoFuenteId) as Record<string, unknown>[]).map(
		mapRow,
	);
}

export function create(
	db: Database.Database,
	input: CreateTransaccionInput,
): Transaccion {
	const id = ulid();
	const stmt = db.prepare(`
		INSERT INTO transaccion (
			id, documento_fuente_id, cuenta_deposito_id, producto_credito_id,
			fecha, monto, moneda, comercio, comercio_ruc, categoria_id,
			origen_categoria, tipo_pago, cuotas, es_deducible_ir, raw_data
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);
	stmt.run(
		id,
		input.documento_fuente_id,
		input.cuenta_deposito_id ?? null,
		input.producto_credito_id ?? null,
		input.fecha,
		input.monto,
		input.moneda,
		input.comercio,
		input.comercio_ruc ?? null,
		input.categoria_id,
		input.origen_categoria,
		input.tipo_pago,
		input.cuotas ?? null,
		input.es_deducible_ir ? 1 : 0,
		input.raw_data ?? null,
	);

	return findById(db, id) as Transaccion;
}

export function updateCategory(
	db: Database.Database,
	id: string,
	categoriaId: string,
	origenCategoria: OrigenCategoria,
): Transaccion | null {
	const stmt = db.prepare(
		"UPDATE transaccion SET categoria_id = ?, origen_categoria = ? WHERE id = ?",
	);
	stmt.run(categoriaId, origenCategoria, id);

	return findById(db, id);
}

export function markDeductible(
	db: Database.Database,
	id: string,
	esDeducible: boolean,
): Transaccion | null {
	const stmt = db.prepare(
		"UPDATE transaccion SET es_deducible_ir = ? WHERE id = ?",
	);
	stmt.run(esDeducible ? 1 : 0, id);

	return findById(db, id);
}

export function bulkUpdateCategory(
	db: Database.Database,
	fromCategoryId: string,
	toCategoryId: string,
): number {
	const stmt = db.prepare(
		"UPDATE transaccion SET categoria_id = ? WHERE categoria_id = ?",
	);
	const result = stmt.run(toCategoryId, fromCategoryId);

	return result.changes;
}
