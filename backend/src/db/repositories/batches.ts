import type Database from "better-sqlite3";
import { ulid } from "ulid";
import type {
	CreateLoteInput,
	EstadoLote,
	Lote,
	UpdateLoteInput,
} from "../../domain/types.js";

function mapRow(row: Record<string, unknown>): Lote {
	return row as unknown as Lote;
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

export function findAll(db: Database.Database): Lote[] {
	const stmt = db.prepare("SELECT * FROM lote ORDER BY creado_en DESC");
	return (stmt.all() as Record<string, unknown>[]).map(mapRow);
}

export function findById(db: Database.Database, id: string): Lote | null {
	const stmt = db.prepare("SELECT * FROM lote WHERE id = ?");
	const row = stmt.get(id) as Record<string, unknown> | undefined;
	return row ? mapRow(row) : null;
}

export function create(db: Database.Database, input: CreateLoteInput): Lote {
	const id = ulid();
	const stmt = db.prepare(`
		INSERT INTO lote (id, canal, cantidad_documentos)
		VALUES (?, ?, ?)
	`);
	stmt.run(id, input.canal, input.cantidad_documentos);

	return findById(db, id) as Lote;
}

export function update(
	db: Database.Database,
	input: UpdateLoteInput,
): Lote | null {
	const allowedFields = ["estado", "cantidad_documentos", "completado_en"];
	const { setClauses, values } = buildUpdateFields(
		input as unknown as Record<string, unknown>,
		allowedFields,
	);

	if (setClauses.length === 0) {
		return findById(db, input.id);
	}

	values.push(input.id);

	const stmt = db.prepare(
		`UPDATE lote SET ${setClauses.join(", ")} WHERE id = ?`,
	);
	stmt.run(...values);

	return findById(db, input.id);
}

export function complete(db: Database.Database, id: string): Lote | null {
	const countStmt = db.prepare(`
		SELECT
			COUNT(*) as total,
			SUM(CASE WHEN estado = 'NORMALIZADO' THEN 1 ELSE 0 END) as normalizado,
			SUM(CASE WHEN estado = 'ERROR' THEN 1 ELSE 0 END) as error,
			SUM(CASE WHEN estado IN ('NORMALIZADO', 'ERROR') THEN 1 ELSE 0 END) as terminal
		FROM documento_fuente
		WHERE lote_id = ?
	`);
	const counts = countStmt.get(id) as {
		total: number;
		normalizado: number;
		error: number;
		terminal: number;
	};

	if (counts.total === 0) {
		return findById(db, id);
	}

	// If not all documents are in a terminal state, don't change
	if (counts.terminal < counts.total) {
		// Still update cantidad_documentos from actual count
		const updateCountStmt = db.prepare(
			"UPDATE lote SET cantidad_documentos = ? WHERE id = ?",
		);
		updateCountStmt.run(counts.total, id);
		return findById(db, id);
	}

	let estado: EstadoLote;
	if (counts.normalizado === counts.total) {
		estado = "COMPLETADO";
	} else {
		estado = "COMPLETADO_CON_ERRORES";
	}

	const updateStmt = db.prepare(`
		UPDATE lote
		SET estado = ?, cantidad_documentos = ?, completado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
		WHERE id = ?
	`);
	updateStmt.run(estado, counts.total, id);

	return findById(db, id);
}
