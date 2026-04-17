import { describe, expect, it } from "vitest";
import { formatResultAsText } from "../../src/query/executor.js";

// ──────────────────────────────────────────────────────────────
// formatResultAsText
// ──────────────────────────────────────────────────────────────

describe("formatResultAsText", () => {
	it("returns 'No se encontraron resultados.' for empty rows", () => {
		const result = formatResultAsText([], "Total de transacciones");
		expect(result).toBe("No se encontraron resultados.");
	});

	it("returns inline 'explanation: value' for one row with one column", () => {
		const result = formatResultAsText(
			[{ total: 4250 }],
			"Total gastado este mes"
		);
		expect(result).toBe("Total gastado este mes: 4250");
	});

	it("returns list format for one row with multiple columns", () => {
		const result = formatResultAsText(
			[{ nombre: "Restaurantes", monto: 1500 }],
			"Categoría con mayor gasto"
		);
		expect(result).toContain("Categoría con mayor gasto");
		expect(result).toContain("- nombre: Restaurantes, monto: 1500");
	});

	it("returns list format with explanation header for multiple rows", () => {
		const rows = [
			{ categoria: "Restaurantes", total: 3000 },
			{ categoria: "Transporte", total: 1200 },
			{ categoria: "Supermercados", total: 5500 },
		];
		const result = formatResultAsText(rows, "Gasto por categoría");

		expect(result).toContain("Gasto por categoría");
		expect(result).toContain("- categoria: Restaurantes, total: 3000");
		expect(result).toContain("- categoria: Transporte, total: 1200");
		expect(result).toContain("- categoria: Supermercados, total: 5500");
	});

	it("includes explanation as the first line when multiple rows", () => {
		const rows = [
			{ id: "01", monto: 100 },
			{ id: "02", monto: 200 },
		];
		const result = formatResultAsText(rows, "Listado de transacciones");
		const firstLine = result.split("\n")[0];
		expect(firstLine).toBe("Listado de transacciones");
	});

	it("coerces numeric column values to string representation in output", () => {
		const result = formatResultAsText([{ monto: 9999 }], "Monto máximo");
		expect(result).toBe("Monto máximo: 9999");
	});

	it("handles null column values without throwing", () => {
		const result = formatResultAsText(
			[{ monto: null, descripcion: null }],
			"Transacción vacía"
		);
		expect(result).toContain("monto: null");
		expect(result).toContain("descripcion: null");
	});
});
