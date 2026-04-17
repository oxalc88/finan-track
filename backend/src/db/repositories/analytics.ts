import type Database from "better-sqlite3";
import type { EstadoDocumento } from "../../domain/types.js";

// ──────────────────────────────────────────────────────────────
// Result types
// ──────────────────────────────────────────────────────────────

export interface SpendByCategoryResult {
	readonly id: string;
	readonly nombre: string;
	readonly total: number;
	readonly cantidad: number;
}

export interface MonthlyTrendResult {
	readonly mes: string;
	readonly gastos: number;
	readonly ingresos: number;
	readonly cantidad: number;
}

export interface DebtEvolutionResult {
	readonly periodo_fin: string;
	readonly deuda_total: number;
	readonly pago_minimo: number;
	readonly producto_id: string;
	readonly tipo: string;
	readonly categoria_tarjeta: string;
	readonly entidad: string;
}

export interface DeductibleTotalsResult {
	readonly categoria_sunat: string | null;
	readonly total: number;
	readonly cantidad: number;
}

export interface TopCommerceResult {
	readonly comercio: string;
	readonly veces: number;
	readonly total: number;
}

export interface PipelineStatusResult {
	readonly estado: EstadoDocumento;
	readonly cantidad: number;
}

// ──────────────────────────────────────────────────────────────
// Analytical queries
// ──────────────────────────────────────────────────────────────

export function spendByCategory(
	db: Database.Database,
	periodoInicio: string,
	periodoFin: string,
): SpendByCategoryResult[] {
	const stmt = db.prepare(`
		SELECT c.id, c.nombre, SUM(t.monto) as total, COUNT(*) as cantidad
		FROM transaccion t
		JOIN categoria c ON t.categoria_id = c.id
		WHERE t.fecha BETWEEN ? AND ?
		GROUP BY c.id
		ORDER BY total ASC
	`);
	return stmt.all(periodoInicio, periodoFin) as SpendByCategoryResult[];
}

export function monthlyTrend(
	db: Database.Database,
	periodoInicio: string,
	periodoFin: string,
): MonthlyTrendResult[] {
	const stmt = db.prepare(`
		SELECT
			strftime('%Y-%m', fecha) as mes,
			SUM(CASE WHEN monto < 0 THEN monto ELSE 0 END) as gastos,
			SUM(CASE WHEN monto > 0 THEN monto ELSE 0 END) as ingresos,
			COUNT(*) as cantidad
		FROM transaccion
		WHERE fecha BETWEEN ? AND ?
		GROUP BY mes
		ORDER BY mes
	`);
	return stmt.all(periodoInicio, periodoFin) as MonthlyTrendResult[];
}

export function debtEvolution(db: Database.Database): DebtEvolutionResult[] {
	const stmt = db.prepare(`
		SELECT
			r.periodo_fin,
			r.deuda_total,
			r.pago_minimo,
			p.id as producto_id,
			p.tipo,
			p.categoria_tarjeta,
			ef.nombre as entidad
		FROM resumen_estado_cuenta r
		JOIN producto_credito p ON r.producto_credito_id = p.id
		JOIN entidad_financiera ef ON p.entidad_financiera_id = ef.id
		ORDER BY p.id, r.periodo_fin
	`);
	return stmt.all() as DebtEvolutionResult[];
}

export function deductibleTotals(
	db: Database.Database,
	year: string,
): DeductibleTotalsResult[] {
	const stmt = db.prepare(`
		SELECT c.categoria_sunat, SUM(t.monto) as total, COUNT(*) as cantidad
		FROM transaccion t
		JOIN categoria c ON t.categoria_id = c.id
		WHERE t.es_deducible_ir = 1 AND t.fecha BETWEEN ? AND ?
		GROUP BY c.categoria_sunat
	`);
	return stmt.all(
		`${year}-01-01`,
		`${year}-12-31`,
	) as DeductibleTotalsResult[];
}

export function topCommerces(
	db: Database.Database,
	periodoInicio: string,
	periodoFin: string,
	limit = 20,
): TopCommerceResult[] {
	const stmt = db.prepare(`
		SELECT comercio, COUNT(*) as veces, SUM(monto) as total
		FROM transaccion
		WHERE fecha BETWEEN ? AND ?
		GROUP BY comercio
		ORDER BY total ASC
		LIMIT ?
	`);
	return stmt.all(periodoInicio, periodoFin, limit) as TopCommerceResult[];
}

export function pipelineStatus(db: Database.Database): PipelineStatusResult[] {
	const stmt = db.prepare(`
		SELECT estado, COUNT(*) as cantidad
		FROM documento_fuente
		GROUP BY estado
	`);
	return stmt.all() as PipelineStatusResult[];
}
