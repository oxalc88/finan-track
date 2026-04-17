import type Database from "better-sqlite3";
import { ulid } from "ulid";
import type {
	CreateProductoCreditoInput,
	ProductoCredito,
	UpdateProductoCreditoInput,
} from "../../domain/types.js";

function mapRow(row: Record<string, unknown>): ProductoCredito {
	return {
		...row,
		activo: Boolean(row.activo),
	} as ProductoCredito;
}

function buildUpdateFields(
	input: Record<string, unknown>,
	allowedFields: string[],
): { setClauses: string[]; values: unknown[] } {
	const setClauses: string[] = [];
	const values: unknown[] = [];
	for (const field of allowedFields) {
		if (field in input && input[field] !== undefined) {
			setClauses.push(`${field} = ?`);
			// Convert boolean to SQLite integer
			const value = input[field];
			values.push(typeof value === "boolean" ? (value ? 1 : 0) : value);
		}
	}
	return { setClauses, values };
}

export function findAll(db: Database.Database): ProductoCredito[] {
	const stmt = db.prepare(
		"SELECT * FROM producto_credito WHERE activo = 1 ORDER BY creado_en",
	);
	return (stmt.all() as Record<string, unknown>[]).map(mapRow);
}

export function findAllIncludingInactive(
	db: Database.Database,
): ProductoCredito[] {
	const stmt = db.prepare("SELECT * FROM producto_credito ORDER BY creado_en");
	return (stmt.all() as Record<string, unknown>[]).map(mapRow);
}

export function findById(
	db: Database.Database,
	id: string,
): ProductoCredito | null {
	const stmt = db.prepare("SELECT * FROM producto_credito WHERE id = ?");
	const row = stmt.get(id) as Record<string, unknown> | undefined;
	return row ? mapRow(row) : null;
}

export function findByEntidad(
	db: Database.Database,
	entidadFinancieraId: string,
): ProductoCredito[] {
	const stmt = db.prepare(
		"SELECT * FROM producto_credito WHERE entidad_financiera_id = ? AND activo = 1 ORDER BY creado_en",
	);
	return (stmt.all(entidadFinancieraId) as Record<string, unknown>[]).map(
		mapRow,
	);
}

export function create(
	db: Database.Database,
	input: CreateProductoCreditoInput,
): ProductoCredito {
	const id = ulid();
	const activo = input.activo === undefined ? 1 : input.activo ? 1 : 0;
	const stmt = db.prepare(`
		INSERT INTO producto_credito (
			id, entidad_financiera_id, tipo, categoria_tarjeta, linea_credito,
			moneda, fecha_corte, fecha_pago, tasa_interes, cuota_mantenimiento,
			frecuencia_mantenimiento, fecha_apertura, fecha_renovacion,
			periodo_contrato_meses, programa_beneficios, tipo_beneficio,
			tasa_beneficio, activo
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);
	stmt.run(
		id,
		input.entidad_financiera_id,
		input.tipo,
		input.categoria_tarjeta,
		input.linea_credito,
		input.moneda,
		input.fecha_corte,
		input.fecha_pago,
		input.tasa_interes,
		input.cuota_mantenimiento ?? null,
		input.frecuencia_mantenimiento ?? null,
		input.fecha_apertura,
		input.fecha_renovacion ?? null,
		input.periodo_contrato_meses ?? null,
		input.programa_beneficios ?? null,
		input.tipo_beneficio,
		input.tasa_beneficio ?? null,
		activo,
	);

	return findById(db, id) as ProductoCredito;
}

export function update(
	db: Database.Database,
	input: UpdateProductoCreditoInput,
): ProductoCredito | null {
	const allowedFields = [
		"activo",
		"categoria_tarjeta",
		"cuota_mantenimiento",
		"fecha_corte",
		"fecha_pago",
		"fecha_renovacion",
		"frecuencia_mantenimiento",
		"linea_credito",
		"periodo_contrato_meses",
		"programa_beneficios",
		"tasa_beneficio",
		"tasa_interes",
		"tipo_beneficio",
	];
	const { setClauses, values } = buildUpdateFields(
		input as unknown as Record<string, unknown>,
		allowedFields,
	);

	if (setClauses.length === 0) {
		return findById(db, input.id);
	}

	setClauses.push("actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')");
	values.push(input.id);

	const stmt = db.prepare(
		`UPDATE producto_credito SET ${setClauses.join(", ")} WHERE id = ?`,
	);
	stmt.run(...values);

	return findById(db, input.id);
}

export function deactivate(
	db: Database.Database,
	id: string,
): ProductoCredito | null {
	const stmt = db.prepare(`
		UPDATE producto_credito
		SET activo = 0, actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
		WHERE id = ?
	`);
	stmt.run(id);

	return findById(db, id);
}
