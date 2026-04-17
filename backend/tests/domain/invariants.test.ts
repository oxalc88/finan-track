import { describe, expect, it } from "vitest";
import {
	validateCategoriaNombreUnico,
	validateCategoriaRequired,
	validateClaveDescifrado,
	validateConciliacionFuentes,
	validateConciliacionTransition,
	validateDiscrepanciaResolucion,
	validateDiscrepanciaTransition,
	validateDocumentIdempotency,
	validateDocumentoFuenteRequired,
	validateDocumentoTransition,
	validateEntidadParaEstadoCuenta,
	validateFechaDentroPeriodo,
	validateLoteTransition,
	validateMatchUnico,
	validateMergeCategoria,
	validateMontoNoCero,
	validateProductoParaEstadoCuenta,
	validateResumenUnico,
} from "../../src/domain/invariants.js";

// ──────────────────────────────────────────────────────────────
// INV-01 validateDocumentIdempotency
// ──────────────────────────────────────────────────────────────

describe("INV-01 validateDocumentIdempotency", () => {
	it("returns valid when hash is not in the existing list", () => {
		const result = validateDocumentIdempotency("hash-nuevo", [
			"hash-a",
			"hash-b",
		]);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("returns invalid when hash already exists in the list", () => {
		const result = validateDocumentIdempotency("hash-existente", [
			"hash-a",
			"hash-existente",
		]);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain("hash-existente");
	});

	it("returns valid when existing list is empty", () => {
		const result = validateDocumentIdempotency("cualquier-hash", []);
		expect(result.valid).toBe(true);
	});
});

// ──────────────────────────────────────────────────────────────
// INV-02 validateDocumentoFuenteRequired
// ──────────────────────────────────────────────────────────────

describe("INV-02 validateDocumentoFuenteRequired", () => {
	it("returns valid when id is a non-empty string", () => {
		const result = validateDocumentoFuenteRequired("doc-001");
		expect(result.valid).toBe(true);
	});

	it("returns invalid when id is null", () => {
		const result = validateDocumentoFuenteRequired(null);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
	});

	it("returns invalid when id is undefined", () => {
		const result = validateDocumentoFuenteRequired(undefined);
		expect(result.valid).toBe(false);
	});

	it("returns invalid when id is empty string", () => {
		const result = validateDocumentoFuenteRequired("");
		expect(result.valid).toBe(false);
	});
});

// ──────────────────────────────────────────────────────────────
// INV-03 validateCategoriaRequired
// ──────────────────────────────────────────────────────────────

describe("INV-03 validateCategoriaRequired", () => {
	it("returns valid when categoria id is a non-empty string", () => {
		const result = validateCategoriaRequired("cat-001");
		expect(result.valid).toBe(true);
	});

	it("returns invalid when categoria id is null", () => {
		const result = validateCategoriaRequired(null);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
	});

	it("returns invalid when categoria id is undefined", () => {
		const result = validateCategoriaRequired(undefined);
		expect(result.valid).toBe(false);
	});

	it("returns invalid when categoria id is empty string", () => {
		const result = validateCategoriaRequired("");
		expect(result.valid).toBe(false);
	});
});

// ──────────────────────────────────────────────────────────────
// INV-04 validateCategoriaNombreUnico
// ──────────────────────────────────────────────────────────────

describe("INV-04 validateCategoriaNombreUnico", () => {
	it("returns valid when name does not exist in the list", () => {
		const result = validateCategoriaNombreUnico("Restaurantes", [
			"Supermercados",
			"Transporte",
		]);
		expect(result.valid).toBe(true);
	});

	it("returns invalid when name is an exact duplicate", () => {
		const result = validateCategoriaNombreUnico("Restaurantes", [
			"Restaurantes",
		]);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain("Restaurantes");
	});

	it("returns invalid for uppercase variant of existing name", () => {
		const result = validateCategoriaNombreUnico("RESTAURANTES", [
			"restaurantes",
		]);
		expect(result.valid).toBe(false);
	});

	it("returns invalid for lowercase variant of existing name", () => {
		const result = validateCategoriaNombreUnico("restaurantes", [
			"Restaurantes",
		]);
		expect(result.valid).toBe(false);
	});

	it("returns valid when existing list is empty", () => {
		const result = validateCategoriaNombreUnico("Nueva", []);
		expect(result.valid).toBe(true);
	});
});

// ──────────────────────────────────────────────────────────────
// INV-05 validateMergeCategoria
// ──────────────────────────────────────────────────────────────

describe("INV-05 validateMergeCategoria", () => {
	it("returns valid when source and target are different ids", () => {
		const result = validateMergeCategoria("cat-001", "cat-002");
		expect(result.valid).toBe(true);
	});

	it("returns invalid when source and target are the same id", () => {
		const result = validateMergeCategoria("cat-001", "cat-001");
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
	});
});

// ──────────────────────────────────────────────────────────────
// INV-06 validateClaveDescifrado
// ──────────────────────────────────────────────────────────────

describe("INV-06 validateClaveDescifrado", () => {
	it("returns valid when document is not encrypted", () => {
		const result = validateClaveDescifrado(false, "");
		expect(result.valid).toBe(true);
	});

	it("returns valid when document is encrypted and key is provided", () => {
		const result = validateClaveDescifrado(true, "12345678");
		expect(result.valid).toBe(true);
	});

	it("returns invalid when document is encrypted but key is empty", () => {
		const result = validateClaveDescifrado(true, "");
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
	});
});

// ──────────────────────────────────────────────────────────────
// INV-07 validateMatchUnico
// ──────────────────────────────────────────────────────────────

describe("INV-07 validateMatchUnico", () => {
	it("returns valid when registro id is not already matched", () => {
		const result = validateMatchUnico("reg-003", ["reg-001", "reg-002"]);
		expect(result.valid).toBe(true);
	});

	it("returns invalid when registro id is already in matched list", () => {
		const result = validateMatchUnico("reg-001", ["reg-001", "reg-002"]);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain("reg-001");
	});

	it("returns valid when matched list is empty", () => {
		const result = validateMatchUnico("reg-001", []);
		expect(result.valid).toBe(true);
	});
});

// ──────────────────────────────────────────────────────────────
// INV-08 validateConciliacionFuentes
// ──────────────────────────────────────────────────────────────

describe("INV-08 validateConciliacionFuentes", () => {
	it("returns valid when both sources have records", () => {
		const result = validateConciliacionFuentes(10, 8);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("returns one error when fuente A is zero", () => {
		const result = validateConciliacionFuentes(0, 5);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain("fuente A");
	});

	it("returns one error when fuente B is zero", () => {
		const result = validateConciliacionFuentes(5, 0);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain("fuente B");
	});

	it("returns two errors when both sources are zero", () => {
		const result = validateConciliacionFuentes(0, 0);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(2);
	});

	it("returns one error when fuente A is negative", () => {
		const result = validateConciliacionFuentes(-1, 5);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
	});
});

// ──────────────────────────────────────────────────────────────
// INV-09 validateDiscrepanciaResolucion
// ──────────────────────────────────────────────────────────────

describe("INV-09 validateDiscrepanciaResolucion", () => {
	it("returns valid when RESUELTA has resolution text", () => {
		const result = validateDiscrepanciaResolucion(
			"RESUELTA",
			"El monto difiere por redondeo"
		);
		expect(result.valid).toBe(true);
	});

	it("returns invalid when RESUELTA has null resolution", () => {
		const result = validateDiscrepanciaResolucion("RESUELTA", null);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
	});

	it("returns invalid when RESUELTA has undefined resolution", () => {
		const result = validateDiscrepanciaResolucion("RESUELTA", undefined);
		expect(result.valid).toBe(false);
	});

	it("returns invalid when RESUELTA has empty string resolution", () => {
		const result = validateDiscrepanciaResolucion("RESUELTA", "");
		expect(result.valid).toBe(false);
	});

	it("returns valid when PENDIENTE has no resolution", () => {
		const result = validateDiscrepanciaResolucion("PENDIENTE", null);
		expect(result.valid).toBe(true);
	});

	it("returns valid when IGNORADA has no resolution", () => {
		const result = validateDiscrepanciaResolucion("IGNORADA", null);
		expect(result.valid).toBe(true);
	});
});

// ──────────────────────────────────────────────────────────────
// INV-10 validateMontoNoCero
// ──────────────────────────────────────────────────────────────

describe("INV-10 validateMontoNoCero", () => {
	it("returns valid for a positive monto", () => {
		const result = validateMontoNoCero(4250);
		expect(result.valid).toBe(true);
	});

	it("returns valid for a negative monto (credit/refund)", () => {
		const result = validateMontoNoCero(-1000);
		expect(result.valid).toBe(true);
	});

	it("returns invalid for monto = 0", () => {
		const result = validateMontoNoCero(0);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
	});
});

// ──────────────────────────────────────────────────────────────
// INV-11 validateEntidadParaEstadoCuenta
// ──────────────────────────────────────────────────────────────

describe("INV-11 validateEntidadParaEstadoCuenta", () => {
	it("returns valid for ESTADO_CUENTA with entity id", () => {
		const result = validateEntidadParaEstadoCuenta("ESTADO_CUENTA", "ent-001");
		expect(result.valid).toBe(true);
	});

	it("returns invalid for ESTADO_CUENTA without entity id (null)", () => {
		const result = validateEntidadParaEstadoCuenta("ESTADO_CUENTA", null);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain("ESTADO_CUENTA");
	});

	it("returns invalid for NOTIFICACION_CONSUMO without entity id", () => {
		const result = validateEntidadParaEstadoCuenta(
			"NOTIFICACION_CONSUMO",
			null
		);
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain("NOTIFICACION_CONSUMO");
	});

	it("returns valid for VOUCHER without entity id", () => {
		const result = validateEntidadParaEstadoCuenta("VOUCHER", null);
		expect(result.valid).toBe(true);
	});

	it("returns valid for FACTURA without entity id", () => {
		const result = validateEntidadParaEstadoCuenta("FACTURA", undefined);
		expect(result.valid).toBe(true);
	});
});

// ──────────────────────────────────────────────────────────────
// INV-12 validateProductoParaEstadoCuenta
// ──────────────────────────────────────────────────────────────

describe("INV-12 validateProductoParaEstadoCuenta", () => {
	it("returns valid for ESTADO_CUENTA with product id", () => {
		const result = validateProductoParaEstadoCuenta(
			"ESTADO_CUENTA",
			"prod-001"
		);
		expect(result.valid).toBe(true);
	});

	it("returns invalid for ESTADO_CUENTA without product id", () => {
		const result = validateProductoParaEstadoCuenta("ESTADO_CUENTA", null);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain("ESTADO_CUENTA");
	});

	it("returns valid for VOUCHER without product id", () => {
		const result = validateProductoParaEstadoCuenta("VOUCHER", null);
		expect(result.valid).toBe(true);
	});

	it("returns valid for FACTURA without product id", () => {
		const result = validateProductoParaEstadoCuenta("FACTURA", undefined);
		expect(result.valid).toBe(true);
	});
});

// ──────────────────────────────────────────────────────────────
// INV-13 validateFechaDentroPeriodo
// ──────────────────────────────────────────────────────────────

describe("INV-13 validateFechaDentroPeriodo", () => {
	const inicio = "2026-01-01";
	const fin = "2026-01-31";

	it("returns valid for a date within the period", () => {
		const result = validateFechaDentroPeriodo("2026-01-15", inicio, fin);
		expect(result.valid).toBe(true);
	});

	it("returns valid for a date equal to periodo_inicio (boundary)", () => {
		const result = validateFechaDentroPeriodo(inicio, inicio, fin);
		expect(result.valid).toBe(true);
	});

	it("returns valid for a date equal to periodo_fin (boundary)", () => {
		const result = validateFechaDentroPeriodo(fin, inicio, fin);
		expect(result.valid).toBe(true);
	});

	it("returns invalid for a date before periodo_inicio", () => {
		const result = validateFechaDentroPeriodo("2025-12-31", inicio, fin);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain("2025-12-31");
	});

	it("returns invalid for a date after periodo_fin", () => {
		const result = validateFechaDentroPeriodo("2026-02-01", inicio, fin);
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain("2026-02-01");
	});
});

// ──────────────────────────────────────────────────────────────
// INV-14 validateResumenUnico
// ──────────────────────────────────────────────────────────────

describe("INV-14 validateResumenUnico", () => {
	const existing = [
		{
			producto_credito_id: "prod-001",
			periodo_inicio: "2026-01-01",
			periodo_fin: "2026-01-31",
		},
	];

	it("returns valid when no matching resumen exists", () => {
		const result = validateResumenUnico(
			"prod-002",
			"2026-01-01",
			"2026-01-31",
			existing
		);
		expect(result.valid).toBe(true);
	});

	it("returns valid for same product but different period", () => {
		const result = validateResumenUnico(
			"prod-001",
			"2026-02-01",
			"2026-02-28",
			existing
		);
		expect(result.valid).toBe(true);
	});

	it("returns invalid for exact product + period match", () => {
		const result = validateResumenUnico(
			"prod-001",
			"2026-01-01",
			"2026-01-31",
			existing
		);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain("prod-001");
	});

	it("returns valid when existing list is empty", () => {
		const result = validateResumenUnico(
			"prod-001",
			"2026-01-01",
			"2026-01-31",
			[]
		);
		expect(result.valid).toBe(true);
	});
});

// ──────────────────────────────────────────────────────────────
// State machine: DocumentoFuente transitions
// ──────────────────────────────────────────────────────────────

describe("validateDocumentoTransition", () => {
	it("allows RECIBIDO → PROCESANDO", () => {
		expect(validateDocumentoTransition("RECIBIDO", "PROCESANDO").valid).toBe(
			true
		);
	});

	it("allows PROCESANDO → NORMALIZADO", () => {
		expect(validateDocumentoTransition("PROCESANDO", "NORMALIZADO").valid).toBe(
			true
		);
	});

	it("allows PROCESANDO → ERROR", () => {
		expect(validateDocumentoTransition("PROCESANDO", "ERROR").valid).toBe(true);
	});

	it("allows ERROR → PROCESANDO (retry)", () => {
		expect(validateDocumentoTransition("ERROR", "PROCESANDO").valid).toBe(true);
	});

	it("rejects RECIBIDO → NORMALIZADO (skip step)", () => {
		const result = validateDocumentoTransition("RECIBIDO", "NORMALIZADO");
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain("RECIBIDO");
		expect(result.errors[0]).toContain("NORMALIZADO");
	});

	it("rejects NORMALIZADO → PROCESANDO (terminal state)", () => {
		const result = validateDocumentoTransition("NORMALIZADO", "PROCESANDO");
		expect(result.valid).toBe(false);
	});
});

// ──────────────────────────────────────────────────────────────
// State machine: Lote transitions
// ──────────────────────────────────────────────────────────────

describe("validateLoteTransition", () => {
	it("allows EN_PROCESO → COMPLETADO", () => {
		expect(validateLoteTransition("EN_PROCESO", "COMPLETADO").valid).toBe(true);
	});

	it("allows EN_PROCESO → COMPLETADO_CON_ERRORES", () => {
		expect(
			validateLoteTransition("EN_PROCESO", "COMPLETADO_CON_ERRORES").valid
		).toBe(true);
	});

	it("rejects COMPLETADO → EN_PROCESO", () => {
		const result = validateLoteTransition("COMPLETADO", "EN_PROCESO");
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain("COMPLETADO");
		expect(result.errors[0]).toContain("EN_PROCESO");
	});

	it("rejects COMPLETADO_CON_ERRORES → EN_PROCESO", () => {
		const result = validateLoteTransition(
			"COMPLETADO_CON_ERRORES",
			"EN_PROCESO"
		);
		expect(result.valid).toBe(false);
	});
});

// ──────────────────────────────────────────────────────────────
// State machine: Conciliacion transitions
// ──────────────────────────────────────────────────────────────

describe("validateConciliacionTransition", () => {
	it("allows PENDIENTE → EN_PROCESO", () => {
		expect(
			validateConciliacionTransition("PENDIENTE", "EN_PROCESO").valid
		).toBe(true);
	});

	it("allows EN_PROCESO → COMPLETADA", () => {
		expect(
			validateConciliacionTransition("EN_PROCESO", "COMPLETADA").valid
		).toBe(true);
	});

	it("rejects PENDIENTE → COMPLETADA (skip step)", () => {
		const result = validateConciliacionTransition("PENDIENTE", "COMPLETADA");
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain("PENDIENTE");
		expect(result.errors[0]).toContain("COMPLETADA");
	});

	it("rejects COMPLETADA → EN_PROCESO (terminal state)", () => {
		const result = validateConciliacionTransition("COMPLETADA", "EN_PROCESO");
		expect(result.valid).toBe(false);
	});
});

// ──────────────────────────────────────────────────────────────
// State machine: Discrepancia transitions
// ──────────────────────────────────────────────────────────────

describe("validateDiscrepanciaTransition", () => {
	it("allows PENDIENTE → RESUELTA", () => {
		expect(validateDiscrepanciaTransition("PENDIENTE", "RESUELTA").valid).toBe(
			true
		);
	});

	it("allows PENDIENTE → IGNORADA", () => {
		expect(validateDiscrepanciaTransition("PENDIENTE", "IGNORADA").valid).toBe(
			true
		);
	});

	it("rejects RESUELTA → PENDIENTE", () => {
		const result = validateDiscrepanciaTransition("RESUELTA", "PENDIENTE");
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain("RESUELTA");
		expect(result.errors[0]).toContain("PENDIENTE");
	});

	it("rejects IGNORADA → PENDIENTE", () => {
		const result = validateDiscrepanciaTransition("IGNORADA", "PENDIENTE");
		expect(result.valid).toBe(false);
	});
});
