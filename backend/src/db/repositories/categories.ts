import type Database from "better-sqlite3";
import { ulid } from "ulid";
import type {
	Categoria,
	CreateCategoriaInput,
	UpdateCategoriaInput,
} from "../../domain/types.js";

function mapRow(row: Record<string, unknown>): Categoria {
	return {
		...row,
		activa: Boolean(row.activa),
		es_deducible_sunat: Boolean(row.es_deducible_sunat),
	} as Categoria;
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
			const value = input[field];
			values.push(typeof value === "boolean" ? (value ? 1 : 0) : value);
		}
	}
	return { setClauses, values };
}

export function findAll(db: Database.Database): Categoria[] {
	const stmt = db.prepare(
		"SELECT * FROM categoria WHERE activa = 1 AND mergeada_en_id IS NULL ORDER BY nombre",
	);
	return (stmt.all() as Record<string, unknown>[]).map(mapRow);
}

export function findAllIncludingMerged(db: Database.Database): Categoria[] {
	const stmt = db.prepare("SELECT * FROM categoria ORDER BY nombre");
	return (stmt.all() as Record<string, unknown>[]).map(mapRow);
}

export function findById(
	db: Database.Database,
	id: string,
): Categoria | null {
	const stmt = db.prepare("SELECT * FROM categoria WHERE id = ?");
	const row = stmt.get(id) as Record<string, unknown> | undefined;
	return row ? mapRow(row) : null;
}

export function findByNombre(
	db: Database.Database,
	nombre: string,
): Categoria | null {
	const stmt = db.prepare(
		"SELECT * FROM categoria WHERE nombre = ? COLLATE NOCASE AND activa = 1 AND mergeada_en_id IS NULL",
	);
	const row = stmt.get(nombre) as Record<string, unknown> | undefined;
	return row ? mapRow(row) : null;
}

export function getActiveNames(db: Database.Database): string[] {
	const stmt = db.prepare(
		"SELECT nombre FROM categoria WHERE activa = 1 AND mergeada_en_id IS NULL ORDER BY nombre",
	);
	return (stmt.all() as Array<{ nombre: string }>).map((r) => r.nombre);
}

export function create(
	db: Database.Database,
	input: CreateCategoriaInput,
): Categoria {
	const id = ulid();
	const activa = input.activa === undefined ? 1 : input.activa ? 1 : 0;
	const es_deducible_sunat = input.es_deducible_sunat ? 1 : 0;
	const stmt = db.prepare(`
		INSERT INTO categoria (id, nombre, descripcion, origen, es_deducible_sunat, categoria_sunat, activa)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`);
	stmt.run(
		id,
		input.nombre,
		input.descripcion ?? null,
		input.origen,
		es_deducible_sunat,
		input.categoria_sunat ?? null,
		activa,
	);

	return findById(db, id) as Categoria;
}

export function update(
	db: Database.Database,
	input: UpdateCategoriaInput,
): Categoria | null {
	const allowedFields = [
		"nombre",
		"descripcion",
		"es_deducible_sunat",
		"categoria_sunat",
		"activa",
		"mergeada_en_id",
	];
	const { setClauses, values } = buildUpdateFields(
		input as unknown as Record<string, unknown>,
		allowedFields,
	);

	if (setClauses.length === 0) {
		return findById(db, input.id);
	}

	values.push(input.id);

	const stmt = db.prepare(
		`UPDATE categoria SET ${setClauses.join(", ")} WHERE id = ?`,
	);
	stmt.run(...values);

	return findById(db, input.id);
}

export function merge(
	db: Database.Database,
	sourceId: string,
	targetId: string,
): number {
	const doMerge = db.transaction(() => {
		const updateTransactions = db.prepare(
			"UPDATE transaccion SET categoria_id = ? WHERE categoria_id = ?",
		);
		const result = updateTransactions.run(targetId, sourceId);

		const updateCategory = db.prepare(
			"UPDATE categoria SET mergeada_en_id = ?, activa = 0 WHERE id = ?",
		);
		updateCategory.run(targetId, sourceId);

		return result.changes;
	});

	return doMerge();
}
