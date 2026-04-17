import type Database from "better-sqlite3";
import { ulid } from "ulid";
import type {
	CreateDocumentoFuenteInput,
	DocumentoFuente,
	EstadoDocumento,
	UpdateDocumentoFuenteInput,
} from "../../domain/types.js";

function mapRow(row: Record<string, unknown>): DocumentoFuente {
	return {
		...row,
		cifrado: Boolean(row.cifrado),
	} as DocumentoFuente;
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

export function findAll(
	db: Database.Database,
	options?: { estado?: EstadoDocumento; limit?: number; offset?: number },
): DocumentoFuente[] {
	const whereClauses: string[] = [];
	const params: unknown[] = [];

	if (options?.estado) {
		whereClauses.push("estado = ?");
		params.push(options.estado);
	}

	const where =
		whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

	const limit = options?.limit ?? 100;
	const offset = options?.offset ?? 0;

	const stmt = db.prepare(
		`SELECT * FROM documento_fuente ${where} ORDER BY recibido_en DESC LIMIT ? OFFSET ?`,
	);
	params.push(limit, offset);

	return (stmt.all(...params) as Record<string, unknown>[]).map(mapRow);
}

export function findById(
	db: Database.Database,
	id: string,
): DocumentoFuente | null {
	const stmt = db.prepare("SELECT * FROM documento_fuente WHERE id = ?");
	const row = stmt.get(id) as Record<string, unknown> | undefined;
	return row ? mapRow(row) : null;
}

export function findByHash(
	db: Database.Database,
	hash: string,
): DocumentoFuente | null {
	const stmt = db.prepare("SELECT * FROM documento_fuente WHERE hash = ?");
	const row = stmt.get(hash) as Record<string, unknown> | undefined;
	return row ? mapRow(row) : null;
}

export function findByLote(
	db: Database.Database,
	loteId: string,
): DocumentoFuente[] {
	const stmt = db.prepare(
		"SELECT * FROM documento_fuente WHERE lote_id = ? ORDER BY recibido_en DESC",
	);
	return (stmt.all(loteId) as Record<string, unknown>[]).map(mapRow);
}

export function create(
	db: Database.Database,
	input: CreateDocumentoFuenteInput,
): DocumentoFuente {
	const id = ulid();
	const cifrado = input.cifrado ? 1 : 0;
	const stmt = db.prepare(`
		INSERT INTO documento_fuente (
			id, hash, canal, tipo, nombre_archivo, formato, cifrado,
			entidad_financiera_id, producto_credito_id, estado, error_detalle,
			r2_key, drive_file_id, storage_tier, lote_id
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);
	stmt.run(
		id,
		input.hash,
		input.canal,
		input.tipo,
		input.nombre_archivo ?? null,
		input.formato,
		cifrado,
		input.entidad_financiera_id ?? null,
		input.producto_credito_id ?? null,
		input.estado ?? "RECIBIDO",
		input.error_detalle ?? null,
		input.r2_key ?? null,
		input.drive_file_id ?? null,
		input.storage_tier ?? "HOT",
		input.lote_id ?? null,
	);

	return findById(db, id) as DocumentoFuente;
}

export function updateEstado(
	db: Database.Database,
	id: string,
	estado: EstadoDocumento,
	errorDetalle?: string,
): DocumentoFuente | null {
	if (estado === "NORMALIZADO") {
		const stmt = db.prepare(`
			UPDATE documento_fuente
			SET estado = ?, error_detalle = ?, procesado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
			WHERE id = ?
		`);
		stmt.run(estado, errorDetalle ?? null, id);
	} else {
		const stmt = db.prepare(`
			UPDATE documento_fuente
			SET estado = ?, error_detalle = ?
			WHERE id = ?
		`);
		stmt.run(estado, errorDetalle ?? null, id);
	}

	return findById(db, id);
}

export function update(
	db: Database.Database,
	input: UpdateDocumentoFuenteInput,
): DocumentoFuente | null {
	const allowedFields = [
		"tipo",
		"estado",
		"error_detalle",
		"entidad_financiera_id",
		"producto_credito_id",
		"r2_key",
		"drive_file_id",
		"storage_tier",
		"procesado_en",
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
		`UPDATE documento_fuente SET ${setClauses.join(", ")} WHERE id = ?`,
	);
	stmt.run(...values);

	return findById(db, input.id);
}

export function findArchiveCandidates(
	db: Database.Database,
	olderThanDays: number,
): DocumentoFuente[] {
	const stmt = db.prepare(`
		SELECT * FROM documento_fuente
		WHERE storage_tier = 'HOT' AND recibido_en < datetime('now', '-' || ? || ' days')
		ORDER BY recibido_en ASC
	`);
	return (stmt.all(olderThanDays) as Record<string, unknown>[]).map(mapRow);
}

export function markArchived(
	db: Database.Database,
	id: string,
): DocumentoFuente | null {
	const stmt = db.prepare(`
		UPDATE documento_fuente
		SET storage_tier = 'ARCHIVE', r2_key = NULL
		WHERE id = ?
	`);
	stmt.run(id);

	return findById(db, id);
}
