import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock every repository the adapter imports, at the module boundary.
vi.mock("../../../src/db/repositories/accounts.js", () => ({
	findAll: vi.fn(),
}));
vi.mock("../../../src/db/repositories/products.js", () => ({
	findAll: vi.fn(),
}));
vi.mock("../../../src/db/repositories/entities.js", () => ({
	findAll: vi.fn(),
}));
vi.mock("../../../src/db/repositories/statements.js", () => ({
	findByProducto: vi.fn(),
}));
vi.mock("../../../src/db/repositories/analytics.js", () => ({
	monthlyTrend: vi.fn(),
	spendByCategory: vi.fn(),
}));

// Imports after mocks so the mocked modules are used.
import * as accountsRepo from "../../../src/db/repositories/accounts.js";
import * as analytics from "../../../src/db/repositories/analytics.js";
import * as entitiesRepo from "../../../src/db/repositories/entities.js";
import * as productsRepo from "../../../src/db/repositories/products.js";
import * as statementsRepo from "../../../src/db/repositories/statements.js";
import { buildDashboard } from "../../../src/api/adapters/dashboard.js";

const db = {} as never; // adapter is mock-driven; real DB is never touched.

const fixedNow = new Date(Date.UTC(2026, 3, 17)); // 2026-04-17

function mockAccounts(rows: unknown[]): void {
	vi.mocked(accountsRepo.findAll).mockReturnValue(rows as never);
}
function mockProducts(rows: unknown[]): void {
	vi.mocked(productsRepo.findAll).mockReturnValue(rows as never);
}
function mockEntities(rows: unknown[]): void {
	vi.mocked(entitiesRepo.findAll).mockReturnValue(rows as never);
}
function mockStatements(map: Record<string, unknown[]>): void {
	vi.mocked(statementsRepo.findByProducto).mockImplementation(
		(_db, id) => (map[id as string] ?? []) as never,
	);
}
function mockMonthlyTrend(rows: unknown[]): void {
	vi.mocked(analytics.monthlyTrend).mockReturnValue(rows as never);
}
function mockSpendByCategory(rows: unknown[]): void {
	vi.mocked(analytics.spendByCategory).mockReturnValue(rows as never);
}

beforeEach(() => {
	vi.resetAllMocks();
	mockAccounts([]);
	mockProducts([]);
	mockEntities([]);
	mockStatements({});
	mockMonthlyTrend([]);
	mockSpendByCategory([]);
});

describe("buildDashboard — empty DB", () => {
	it("returns zeros and empty arrays so the frontend can render a blank state", () => {
		const result = buildDashboard(db, fixedNow);

		expect(result.overview).toEqual({
			cashBalance: 0,
			totalDebt: 0,
			netWorth: 0,
			changes: { cashBalance: 0, totalDebt: 0, netWorth: 0 },
		});
		expect(result.accounts).toEqual([]);
		expect(result.creditCards).toEqual([]);
		expect(result.cashFlow).toEqual([]);
		expect(result.expenseCategories).toEqual([]);
	});
});

describe("buildDashboard — accounts", () => {
	it("converts centavo balances to decimal and maps tipo → frontend type", () => {
		mockEntities([{ id: "ent_1", nombre: "BCP" }]);
		mockAccounts([
			{
				id: "cta_1",
				entidad_financiera_id: "ent_1",
				tipo: "AHORRO",
				moneda: "PEN",
				proposito: "Fondo de emergencia",
				saldo: 1_000_000, // S/ 10,000.00
			},
			{
				id: "cta_2",
				entidad_financiera_id: "ent_1",
				tipo: "CORRIENTE",
				moneda: "USD",
				proposito: null,
				saldo: 50_000, // $500.00
			},
		]);

		const result = buildDashboard(db, fixedNow);

		expect(result.accounts).toEqual([
			{
				id: "cta_1",
				name: "Fondo de emergencia · BCP",
				type: "savings",
				balance: 10_000,
				currency: "PEN",
			},
			{
				id: "cta_2",
				name: "CORRIENTE · BCP",
				type: "checking",
				balance: 500,
				currency: "USD",
			},
		]);
		expect(result.overview.cashBalance).toBe(10_500);
	});

	it("falls back to the entity id when the entity is missing from the lookup", () => {
		mockEntities([]);
		mockAccounts([
			{
				id: "cta_1",
				entidad_financiera_id: "ent_unknown",
				tipo: "CTS",
				moneda: "PEN",
				proposito: null,
				saldo: 100,
			},
		]);

		const result = buildDashboard(db, fixedNow);

		expect(result.accounts[0].name).toBe("CTS · ent_unknown");
		expect(result.accounts[0].type).toBe("savings");
	});
});

describe("buildDashboard — credit cards", () => {
	it("uses the latest statement's deuda_total / pago_minimo / fecha_pago and computes utilization", () => {
		mockEntities([{ id: "ent_1", nombre: "Interbank" }]);
		mockProducts([
			{
				id: "prod_1",
				entidad_financiera_id: "ent_1",
				tipo: "VISA",
				categoria_tarjeta: "PLATINUM",
				linea_credito: 10_000_00, // S/ 10,000 limit
			},
		]);
		mockStatements({
			prod_1: [
				// repo returns rows ORDER BY periodo_fin DESC, so [0] is latest.
				{
					deuda_total: 2_500_00, // S/ 2,500 owed
					pago_minimo: 150_00,
					fecha_pago: "2026-04-20",
				},
				{
					deuda_total: 2_000_00,
					pago_minimo: 120_00,
					fecha_pago: "2026-03-20",
				},
			],
		});

		const result = buildDashboard(db, fixedNow);

		expect(result.creditCards).toEqual([
			{
				id: "prod_1",
				name: "VISA PLATINUM · Interbank",
				balance: 2500,
				creditLimit: 10_000,
				minimumPayment: 150,
				dueDate: "2026-04-20",
				utilizationPercentage: 25, // 2500 / 10000 = 25%
			},
		]);
		expect(result.overview.totalDebt).toBe(2500);
		expect(result.overview.netWorth).toBe(-2500);
	});

	it("zeroes balance and utilization when the card has no statement yet", () => {
		mockEntities([{ id: "ent_1", nombre: "BBVA" }]);
		mockProducts([
			{
				id: "prod_1",
				entidad_financiera_id: "ent_1",
				tipo: "MASTERCARD",
				categoria_tarjeta: "GOLD",
				linea_credito: 5_000_00,
			},
		]);
		mockStatements({ prod_1: [] });

		const result = buildDashboard(db, fixedNow);

		expect(result.creditCards[0]).toMatchObject({
			balance: 0,
			minimumPayment: 0,
			dueDate: "",
			utilizationPercentage: 0,
		});
	});

	it("avoids division-by-zero when linea_credito is 0", () => {
		mockEntities([]);
		mockProducts([
			{
				id: "prod_1",
				entidad_financiera_id: "ent_1",
				tipo: "VISA",
				categoria_tarjeta: "CLASICA",
				linea_credito: 0,
			},
		]);
		mockStatements({
			prod_1: [
				{ deuda_total: 100_00, pago_minimo: 10_00, fecha_pago: "2026-04-20" },
			],
		});

		const result = buildDashboard(db, fixedNow);
		expect(result.creditCards[0].utilizationPercentage).toBe(0);
	});
});

describe("buildDashboard — cashFlow and expenseCategories", () => {
	it("flips sign on gastos so the frontend gets positive expenses", () => {
		mockMonthlyTrend([
			{
				mes: "2026-03",
				ingresos: 800_000,
				gastos: -500_000,
				cantidad: 30,
			},
			{
				mes: "2026-04",
				ingresos: 900_000,
				gastos: -600_000,
				cantidad: 25,
			},
		]);

		const result = buildDashboard(db, fixedNow);

		expect(result.cashFlow).toEqual([
			{ month: "2026-03", income: 8000, expenses: 5000 },
			{ month: "2026-04", income: 9000, expenses: 6000 },
		]);
	});

	it("drops non-expense categories and reports each expense share as a percentage", () => {
		mockSpendByCategory([
			{ id: "cat_food", nombre: "Comida", total: -300_000, cantidad: 20 },
			{ id: "cat_rent", nombre: "Alquiler", total: -700_000, cantidad: 1 },
			// An income/refund row with positive total — must be excluded.
			{ id: "cat_refund", nombre: "Reembolsos", total: 50_000, cantidad: 2 },
		]);

		const result = buildDashboard(db, fixedNow);

		expect(result.expenseCategories).toEqual([
			{ category: "Comida", amount: 3000, percentage: 30 },
			{ category: "Alquiler", amount: 7000, percentage: 70 },
		]);
	});

	it("returns an empty array when no expenses exist (avoids NaN percentage)", () => {
		mockSpendByCategory([
			{ id: "cat_refund", nombre: "Reembolsos", total: 10_000, cantidad: 1 },
		]);

		const result = buildDashboard(db, fixedNow);
		expect(result.expenseCategories).toEqual([]);
	});
});

describe("buildDashboard — overview.changes", () => {
	it("computes cashBalance delta from current vs prior month net flow", () => {
		mockMonthlyTrend([
			// Previous month: net = 500_000 + (-300_000) = +200_000
			{
				mes: "2026-03",
				ingresos: 500_000,
				gastos: -300_000,
				cantidad: 10,
			},
			// Current month:  net = 800_000 + (-200_000) = +600_000
			// Delta = 600_000 - 200_000 = 400_000 centavos → 4000 soles
			{
				mes: "2026-04",
				ingresos: 800_000,
				gastos: -200_000,
				cantidad: 12,
			},
		]);

		const result = buildDashboard(db, fixedNow);

		expect(result.overview.changes).toEqual({
			cashBalance: 4000,
			totalDebt: 0,
			netWorth: 4000,
		});
	});

	it("reports zero changes when the trend has fewer than two months", () => {
		mockMonthlyTrend([
			{
				mes: "2026-04",
				ingresos: 900_000,
				gastos: -200_000,
				cantidad: 5,
			},
		]);

		const result = buildDashboard(db, fixedNow);
		expect(result.overview.changes).toEqual({
			cashBalance: 0,
			totalDebt: 0,
			netWorth: 0,
		});
	});
});
