import type Database from "better-sqlite3";
import { ulid } from "ulid";
import type {
	CreateCuentaDepositoInput,
	CuentaDeposito,
	UpdateCuentaDepositoInput,
} from "../../domain/types.js";

function mapRow(row: Record<string, unknown>): CuentaDeposito {
	return row as unknown as CuentaDeposito;
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
			values.push(input[field]);
		}
	}
	return { setClauses, values };
}

export function findAll(db: Database.Database): CuentaDeposito[] {
	const stmt = db.prepare("SELECT * FROM cuenta_deposito ORDER BY creado_en");
	return (stmt.all() as Record<string, unknown>[]).map(mapRow);
}

export function findById(
	db: Database.Database,
	id: string,
): CuentaDeposito | null {
	const stmt = db.prepare("SELECT * FROM cuenta_deposito WHERE id = ?");
	const row = stmt.get(id) as Record<string, unknown> | undefined;
	return row ? mapRow(row) : null;
}

export function findByEntidad(
	db: Database.Database,
	entidadFinancieraId: string,
): CuentaDeposito[] {
	const stmt = db.prepare(
		"SELECT * FROM cuenta_deposito WHERE entidad_financiera_id = ? ORDER BY creado_en",
	);
	return (stmt.all(entidadFinancieraId) as Record<string, unknown>[]).map(
		mapRow,
	);
}

export function create(
	db: Database.Database,
	input: CreateCuentaDepositoInput,
): CuentaDeposito {
	const id = ulid();
	const stmt = db.prepare(`
		INSERT INTO cuenta_deposito (id, entidad_financiera_id, tipo, moneda, proposito, saldo, tasa_interes, saldo_actualizado_en)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`);
	stmt.run(
		id,
		input.entidad_financiera_id,
		input.tipo,
		input.moneda,
		input.proposito ?? null,
		input.saldo ?? 0,
		input.tasa_interes ?? null,
		input.saldo_actualizado_en ?? null,
	);

	return findById(db, id) as CuentaDeposito;
}

export function update(
	db: Database.Database,
	input: UpdateCuentaDepositoInput,
): CuentaDeposito | null {
	const allowedFields = [
		"tipo",
		"moneda",
		"proposito",
		"saldo",
		"tasa_interes",
		"saldo_actualizado_en",
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
		`UPDATE cuenta_deposito SET ${setClauses.join(", ")} WHERE id = ?`,
	);
	stmt.run(...values);

	return findById(db, input.id);
}

export function updateBalance(
	db: Database.Database,
	id: string,
	saldo: number,
): CuentaDeposito | null {
	const stmt = db.prepare(`
		UPDATE cuenta_deposito
		SET saldo = ?, saldo_actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
		WHERE id = ?
	`);
	stmt.run(saldo, id);

	return findById(db, id);
}
