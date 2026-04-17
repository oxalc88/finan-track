import type Database from "better-sqlite3";
import { ulid } from "ulid";
import type {
	Conciliacion,
	CreateConciliacionInput,
	CreateDiscrepanciaInput,
	CreateMatchConciliacionInput,
	Discrepancia,
	MatchConciliacion,
	UpdateConciliacionInput,
} from "../../domain/types.js";

// ──────────────────────────────────────────────────────────────
// Row mappers
// ──────────────────────────────────────────────────────────────

function mapConciliacionRow(row: Record<string, unknown>): Conciliacion {
	return row as unknown as Conciliacion;
}

function mapMatchRow(row: Record<string, unknown>): MatchConciliacion {
	return {
		...row,
		confirmado: Boolean(row.confirmado),
	} as MatchConciliacion;
}

function mapDiscrepanciaRow(row: Record<string, unknown>): Discrepancia {
	return row as unknown as Discrepancia;
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

// ──────────────────────────────────────────────────────────────
// Conciliacion
// ──────────────────────────────────────────────────────────────

export function findAll(db: Database.Database): Conciliacion[] {
	const stmt = db.prepare(
		"SELECT * FROM conciliacion ORDER BY creado_en DESC",
	);
	return (stmt.all() as Record<string, unknown>[]).map(mapConciliacionRow);
}

export function findById(
	db: Database.Database,
	id: string,
): Conciliacion | null {
	const stmt = db.prepare("SELECT * FROM conciliacion WHERE id = ?");
	const row = stmt.get(id) as Record<string, unknown> | undefined;
	return row ? mapConciliacionRow(row) : null;
}

export function create(
	db: Database.Database,
	input: CreateConciliacionInput,
): Conciliacion {
	const id = ulid();
	const stmt = db.prepare(`
		INSERT INTO conciliacion (id, tipo, periodo, total_registros_fuente_a, total_registros_fuente_b)
		VALUES (?, ?, ?, ?, ?)
	`);
	stmt.run(
		id,
		input.tipo,
		input.periodo,
		input.total_registros_fuente_a ?? 0,
		input.total_registros_fuente_b ?? 0,
	);

	return findById(db, id) as Conciliacion;
}

export function update(
	db: Database.Database,
	input: UpdateConciliacionInput,
): Conciliacion | null {
	const allowedFields = [
		"estado",
		"total_registros_fuente_a",
		"total_registros_fuente_b",
		"total_matches",
		"total_discrepancias",
		"ejecutada_en",
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
		`UPDATE conciliacion SET ${setClauses.join(", ")} WHERE id = ?`,
	);
	stmt.run(...values);

	return findById(db, input.id);
}

// ──────────────────────────────────────────────────────────────
// Match Conciliacion
// ──────────────────────────────────────────────────────────────

export function findMatchesByConciliacion(
	db: Database.Database,
	conciliacionId: string,
): MatchConciliacion[] {
	const stmt = db.prepare(
		"SELECT * FROM match_conciliacion WHERE conciliacion_id = ? ORDER BY creado_en",
	);
	return (stmt.all(conciliacionId) as Record<string, unknown>[]).map(
		mapMatchRow,
	);
}

export function createMatch(
	db: Database.Database,
	input: CreateMatchConciliacionInput,
): MatchConciliacion {
	const id = ulid();
	const confirmado = input.confirmado ? 1 : 0;
	const stmt = db.prepare(`
		INSERT INTO match_conciliacion (
			id, conciliacion_id, registro_fuente_a_id, registro_fuente_a_tipo,
			registro_fuente_b_id, registro_fuente_b_tipo, confianza, confirmado
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`);
	stmt.run(
		id,
		input.conciliacion_id,
		input.registro_fuente_a_id,
		input.registro_fuente_a_tipo,
		input.registro_fuente_b_id,
		input.registro_fuente_b_tipo,
		input.confianza,
		confirmado,
	);

	const readStmt = db.prepare(
		"SELECT * FROM match_conciliacion WHERE id = ?",
	);
	const row = readStmt.get(id) as Record<string, unknown>;
	return mapMatchRow(row);
}

export function confirmMatch(
	db: Database.Database,
	id: string,
): MatchConciliacion | null {
	const stmt = db.prepare(
		"UPDATE match_conciliacion SET confirmado = 1 WHERE id = ?",
	);
	stmt.run(id);

	const readStmt = db.prepare(
		"SELECT * FROM match_conciliacion WHERE id = ?",
	);
	const row = readStmt.get(id) as Record<string, unknown> | undefined;
	return row ? mapMatchRow(row) : null;
}

export function getMatchedIds(
	db: Database.Database,
	conciliacionId: string,
	fuente: "a" | "b",
): string[] {
	const column =
		fuente === "a" ? "registro_fuente_a_id" : "registro_fuente_b_id";
	const stmt = db.prepare(
		`SELECT ${column} as registro_id FROM match_conciliacion WHERE conciliacion_id = ?`,
	);
	const rows = stmt.all(conciliacionId) as Array<{ registro_id: string }>;
	return rows.map((r) => r.registro_id);
}

// ──────────────────────────────────────────────────────────────
// Discrepancia
// ──────────────────────────────────────────────────────────────

export function findDiscrepanciasByConciliacion(
	db: Database.Database,
	conciliacionId: string,
): Discrepancia[] {
	const stmt = db.prepare(
		"SELECT * FROM discrepancia WHERE conciliacion_id = ? ORDER BY creado_en",
	);
	return (stmt.all(conciliacionId) as Record<string, unknown>[]).map(
		mapDiscrepanciaRow,
	);
}

export interface PendingDiscrepancia extends Discrepancia {
	readonly conciliacion_tipo: string;
	readonly conciliacion_periodo: string;
}

export function findPendingDiscrepancias(
	db: Database.Database,
): PendingDiscrepancia[] {
	const stmt = db.prepare(`
		SELECT d.*, c.tipo as conciliacion_tipo, c.periodo as conciliacion_periodo
		FROM discrepancia d
		JOIN conciliacion c ON d.conciliacion_id = c.id
		WHERE d.estado = 'PENDIENTE'
		ORDER BY d.creado_en DESC
	`);
	return stmt.all() as PendingDiscrepancia[];
}

export function createDiscrepancia(
	db: Database.Database,
	input: CreateDiscrepanciaInput,
): Discrepancia {
	const id = ulid();
	const stmt = db.prepare(`
		INSERT INTO discrepancia (id, conciliacion_id, registro_id, registro_tipo, fuente, tipo)
		VALUES (?, ?, ?, ?, ?, ?)
	`);
	stmt.run(
		id,
		input.conciliacion_id,
		input.registro_id,
		input.registro_tipo,
		input.fuente,
		input.tipo,
	);

	const readStmt = db.prepare("SELECT * FROM discrepancia WHERE id = ?");
	const row = readStmt.get(id) as Record<string, unknown>;
	return mapDiscrepanciaRow(row);
}

export function resolveDiscrepancia(
	db: Database.Database,
	id: string,
	resolucion: string,
): Discrepancia | null {
	const stmt = db.prepare(`
		UPDATE discrepancia
		SET estado = 'RESUELTA', resolucion = ?, resuelta_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
		WHERE id = ?
	`);
	stmt.run(resolucion, id);

	const readStmt = db.prepare("SELECT * FROM discrepancia WHERE id = ?");
	const row = readStmt.get(id) as Record<string, unknown> | undefined;
	return row ? mapDiscrepanciaRow(row) : null;
}

export function ignoreDiscrepancia(
	db: Database.Database,
	id: string,
): Discrepancia | null {
	const stmt = db.prepare(`
		UPDATE discrepancia
		SET estado = 'IGNORADA', resuelta_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
		WHERE id = ?
	`);
	stmt.run(id);

	const readStmt = db.prepare("SELECT * FROM discrepancia WHERE id = ?");
	const row = readStmt.get(id) as Record<string, unknown> | undefined;
	return row ? mapDiscrepanciaRow(row) : null;
}
