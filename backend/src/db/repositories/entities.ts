import type Database from "better-sqlite3";
import { ulid } from "ulid";
import type {
	CreateEntidadFinancieraInput,
	EntidadFinanciera,
	UpdateEntidadFinancieraInput,
} from "../../domain/types.js";

function mapRow(row: Record<string, unknown>): EntidadFinanciera {
	return row as unknown as EntidadFinanciera;
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

export function findAll(db: Database.Database): EntidadFinanciera[] {
	const stmt = db.prepare("SELECT * FROM entidad_financiera ORDER BY nombre");
	return (stmt.all() as Record<string, unknown>[]).map(mapRow);
}

export function findById(
	db: Database.Database,
	id: string,
): EntidadFinanciera | null {
	const stmt = db.prepare("SELECT * FROM entidad_financiera WHERE id = ?");
	const row = stmt.get(id) as Record<string, unknown> | undefined;
	return row ? mapRow(row) : null;
}

export function create(
	db: Database.Database,
	input: CreateEntidadFinancieraInput,
): EntidadFinanciera {
	const id = ulid();
	const stmt = db.prepare(`
		INSERT INTO entidad_financiera (id, nombre, tipo, clave_descifrado, patron_clave)
		VALUES (?, ?, ?, ?, ?)
	`);
	stmt.run(id, input.nombre, input.tipo, input.clave_descifrado, input.patron_clave);

	return findById(db, id) as EntidadFinanciera;
}

export function update(
	db: Database.Database,
	input: UpdateEntidadFinancieraInput,
): EntidadFinanciera | null {
	const allowedFields = ["nombre", "tipo", "clave_descifrado", "patron_clave"];
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
		`UPDATE entidad_financiera SET ${setClauses.join(", ")} WHERE id = ?`,
	);
	stmt.run(...values);

	return findById(db, input.id);
}
