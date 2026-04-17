import type {
	Account,
	CashFlowData,
	CreditCard,
	DashboardData,
	ExpenseCategory,
} from "@finanzas/shared-types";
import type Database from "better-sqlite3";
import * as accountsRepo from "../../db/repositories/accounts.js";
import * as analytics from "../../db/repositories/analytics.js";
import * as entitiesRepo from "../../db/repositories/entities.js";
import * as productsRepo from "../../db/repositories/products.js";
import * as statementsRepo from "../../db/repositories/statements.js";
import type {
	CuentaDeposito,
	ProductoCredito,
	ResumenEstadoCuenta,
} from "../../domain/types.js";
import { tipoCuentaToAccountType } from "./enums.js";
import { centavosToDecimal } from "./money.js";

const CASH_FLOW_MONTHS = 6;

function startOfMonthUtc(year: number, monthIndex: number): string {
	const m = String(monthIndex + 1).padStart(2, "0");
	return `${year}-${m}-01`;
}

function endOfMonthUtc(year: number, monthIndex: number): string {
	const last = new Date(Date.UTC(year, monthIndex + 1, 0));
	const m = String(monthIndex + 1).padStart(2, "0");
	const d = String(last.getUTCDate()).padStart(2, "0");
	return `${year}-${m}-${d}`;
}

function rollingWindow(
	now: Date,
	months: number,
): { readonly start: string; readonly end: string } {
	const end = endOfMonthUtc(now.getUTCFullYear(), now.getUTCMonth());
	const startMonth = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1),
	);
	const start = startOfMonthUtc(
		startMonth.getUTCFullYear(),
		startMonth.getUTCMonth(),
	);
	return { start, end };
}

function entityNameLookup(db: Database.Database): Map<string, string> {
	const map = new Map<string, string>();
	for (const e of entitiesRepo.findAll(db)) {
		map.set(e.id, e.nombre);
	}
	return map;
}

function buildAccount(
	cuenta: CuentaDeposito,
	entityName: string | undefined,
): Account {
	const suffix = entityName ?? cuenta.entidad_financiera_id;
	const label = cuenta.proposito?.trim() || cuenta.tipo;
	return {
		id: cuenta.id,
		name: `${label} · ${suffix}`,
		type: tipoCuentaToAccountType(cuenta.tipo),
		balance: centavosToDecimal(cuenta.saldo),
		currency: cuenta.moneda,
	};
}

function latestStatement(
	db: Database.Database,
	productoId: string,
): ResumenEstadoCuenta | null {
	const rows = statementsRepo.findByProducto(db, productoId);
	return rows[0] ?? null;
}

function buildCreditCard(
	producto: ProductoCredito,
	entityName: string | undefined,
	latest: ResumenEstadoCuenta | null,
): CreditCard {
	const balance = latest ? centavosToDecimal(latest.deuda_total) : 0;
	const creditLimit = centavosToDecimal(producto.linea_credito);
	const minimumPayment = latest ? centavosToDecimal(latest.pago_minimo) : 0;
	const utilizationPercentage =
		creditLimit > 0
			? Math.round((balance / creditLimit) * 10_000) / 100
			: 0;
	const suffix = entityName ?? producto.entidad_financiera_id;
	return {
		id: producto.id,
		name: `${producto.tipo} ${producto.categoria_tarjeta} · ${suffix}`,
		balance,
		creditLimit,
		minimumPayment,
		dueDate: latest?.fecha_pago ?? "",
		utilizationPercentage,
	};
}

function buildCashFlow(
	trend: readonly analytics.MonthlyTrendResult[],
): CashFlowData[] {
	return trend.map((row) => ({
		month: row.mes,
		income: centavosToDecimal(row.ingresos),
		expenses: centavosToDecimal(-row.gastos),
	}));
}

function buildExpenseCategories(
	rows: readonly analytics.SpendByCategoryResult[],
): ExpenseCategory[] {
	const expenseRows = rows.filter((r) => r.total < 0);
	const totalExpenses = expenseRows.reduce((sum, r) => sum + r.total, 0);
	if (totalExpenses === 0) {
		return [];
	}
	return expenseRows.map((r) => ({
		category: r.nombre,
		amount: centavosToDecimal(-r.total),
		percentage: Math.round((r.total / totalExpenses) * 10_000) / 100,
	}));
}

function computeChanges(
	trend: readonly analytics.MonthlyTrendResult[],
): DashboardData["overview"]["changes"] {
	// We don't persist a balance history. Approximate cashBalance change
	// as the delta in net monthly cash flow (ingresos + gastos, where
	// gastos is negative). totalDebt isn't derivable from monthlyTrend,
	// so it's reported as 0 until a statement-snapshot repo exists.
	if (trend.length < 2) {
		return { cashBalance: 0, totalDebt: 0, netWorth: 0 };
	}
	const curr = trend[trend.length - 1];
	const prev = trend[trend.length - 2];
	const delta = centavosToDecimal(
		curr.ingresos + curr.gastos - (prev.ingresos + prev.gastos),
	);
	return { cashBalance: delta, totalDebt: 0, netWorth: delta };
}

export function buildDashboard(
	db: Database.Database,
	now: Date = new Date(),
): DashboardData {
	const { start, end } = rollingWindow(now, CASH_FLOW_MONTHS);
	const currentMonthStart = startOfMonthUtc(
		now.getUTCFullYear(),
		now.getUTCMonth(),
	);
	const currentMonthEnd = endOfMonthUtc(
		now.getUTCFullYear(),
		now.getUTCMonth(),
	);

	const entityNames = entityNameLookup(db);

	const accounts = accountsRepo
		.findAll(db)
		.map((c) => buildAccount(c, entityNames.get(c.entidad_financiera_id)));

	const creditCards = productsRepo
		.findAll(db)
		.map((p) =>
			buildCreditCard(
				p,
				entityNames.get(p.entidad_financiera_id),
				latestStatement(db, p.id),
			),
		);

	const trend = analytics.monthlyTrend(db, start, end);
	const cashFlow = buildCashFlow(trend);
	const expenseCategories = buildExpenseCategories(
		analytics.spendByCategory(db, currentMonthStart, currentMonthEnd),
	);

	const cashBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
	const totalDebt = creditCards.reduce((sum, c) => sum + c.balance, 0);
	const netWorth = cashBalance - totalDebt;

	return {
		overview: {
			cashBalance,
			totalDebt,
			netWorth,
			changes: computeChanges(trend),
		},
		accounts,
		creditCards,
		cashFlow,
		expenseCategories,
	};
}
