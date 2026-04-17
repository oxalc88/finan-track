// `as const` is a TypeScript-only construct — it enforces readonly at the type
// level but does NOT freeze the array at runtime. These tests verify the
// runtime shape and exhaustiveness of each enum array, which is what matters
// for database CHECK constraints and switch exhaustiveness checks.
import { describe, expect, it } from "vitest";
import {
	CANALES,
	CATEGORIAS_TARJETA,
	ESTADOS_CONCILIACION,
	ESTADOS_DISCREPANCIA,
	ESTADOS_DOCUMENTO,
	ESTADOS_LOTE,
	FORMATOS_DOCUMENTO,
	FRECUENCIAS_MANTENIMIENTO,
	FUENTES_DISCREPANCIA,
	MONEDAS,
	ORIGENES_CATEGORIA,
	ORIGENES_CATEGORIA_CREACION,
	STORAGE_TIERS,
	TIPOS_BENEFICIO,
	TIPOS_CONCILIACION,
	TIPOS_CUENTA,
	TIPOS_DISCREPANCIA,
	TIPOS_DOCUMENTO,
	TIPOS_ENTIDAD,
	TIPOS_PAGO,
	TIPOS_PRODUCTO_CREDITO,
} from "../../src/domain/types.js";

describe("enum arrays", () => {
	it("CANALES contains expected values", () => {
		expect([...CANALES]).toEqual(["TELEGRAM", "EMAIL", "DRIVE"]);
	});

	it("TIPOS_DOCUMENTO contains expected values", () => {
		expect([...TIPOS_DOCUMENTO]).toEqual([
			"ESTADO_CUENTA",
			"VOUCHER",
			"FACTURA",
			"NOTIFICACION_CONSUMO",
			"OTRO",
		]);
	});

	it("FORMATOS_DOCUMENTO contains expected values", () => {
		expect([...FORMATOS_DOCUMENTO]).toEqual(["PDF", "IMAGEN", "EMAIL_HTML"]);
	});

	it("ESTADOS_DOCUMENTO contains expected values", () => {
		expect([...ESTADOS_DOCUMENTO]).toEqual([
			"RECIBIDO",
			"PROCESANDO",
			"NORMALIZADO",
			"ERROR",
		]);
	});

	it("STORAGE_TIERS contains expected values", () => {
		expect([...STORAGE_TIERS]).toEqual(["HOT", "ARCHIVE"]);
	});

	it("TIPOS_ENTIDAD contains expected values", () => {
		expect([...TIPOS_ENTIDAD]).toEqual(["BANCO", "FINTECH", "FINANCIERA"]);
	});

	it("TIPOS_CUENTA contains expected values", () => {
		expect([...TIPOS_CUENTA]).toEqual([
			"AHORRO",
			"PLAZO_FIJO",
			"CTS",
			"CORRIENTE",
		]);
	});

	it("MONEDAS contains expected values", () => {
		expect([...MONEDAS]).toEqual(["PEN", "USD"]);
	});

	it("TIPOS_PRODUCTO_CREDITO contains expected values", () => {
		expect([...TIPOS_PRODUCTO_CREDITO]).toEqual([
			"VISA",
			"MASTERCARD",
			"AMEX",
			"DINERS",
		]);
	});

	it("CATEGORIAS_TARJETA contains expected values", () => {
		expect([...CATEGORIAS_TARJETA]).toEqual([
			"CLASICA",
			"GOLD",
			"PLATINUM",
			"SIGNATURE",
			"INFINITE",
		]);
	});

	it("FRECUENCIAS_MANTENIMIENTO contains expected values", () => {
		expect([...FRECUENCIAS_MANTENIMIENTO]).toEqual(["MENSUAL", "ANUAL"]);
	});

	it("TIPOS_BENEFICIO contains expected values", () => {
		expect([...TIPOS_BENEFICIO]).toEqual([
			"CASHBACK",
			"PUNTOS",
			"MILLAS",
			"NINGUNO",
		]);
	});

	it("ORIGENES_CATEGORIA contains expected values", () => {
		expect([...ORIGENES_CATEGORIA]).toEqual([
			"LLM_SUGERIDA",
			"USUARIO_CORREGIDA",
			"REGLA",
		]);
	});

	it("ORIGENES_CATEGORIA_CREACION contains expected values", () => {
		expect([...ORIGENES_CATEGORIA_CREACION]).toEqual([
			"LLM_SUGERIDA",
			"USUARIO_CREADA",
		]);
	});

	it("TIPOS_PAGO contains expected values", () => {
		expect([...TIPOS_PAGO]).toEqual([
			"TARJETA",
			"EFECTIVO",
			"TRANSFERENCIA",
			"YAPE_PLIN",
		]);
	});

	it("ESTADOS_LOTE contains expected values", () => {
		expect([...ESTADOS_LOTE]).toEqual([
			"EN_PROCESO",
			"COMPLETADO",
			"COMPLETADO_CON_ERRORES",
		]);
	});

	it("TIPOS_CONCILIACION contains expected values", () => {
		expect([...TIPOS_CONCILIACION]).toEqual(["BANCARIA", "TRIBUTARIA"]);
	});

	it("ESTADOS_CONCILIACION contains expected values", () => {
		expect([...ESTADOS_CONCILIACION]).toEqual([
			"PENDIENTE",
			"EN_PROCESO",
			"COMPLETADA",
		]);
	});

	it("FUENTES_DISCREPANCIA contains expected values", () => {
		expect([...FUENTES_DISCREPANCIA]).toEqual(["FUENTE_A", "FUENTE_B"]);
	});

	it("TIPOS_DISCREPANCIA contains expected values", () => {
		expect([...TIPOS_DISCREPANCIA]).toEqual([
			"SIN_MATCH",
			"MONTO_DIFERENTE",
			"FECHA_DIFERENTE",
		]);
	});

	it("ESTADOS_DISCREPANCIA contains expected values", () => {
		expect([...ESTADOS_DISCREPANCIA]).toEqual([
			"PENDIENTE",
			"RESUELTA",
			"IGNORADA",
		]);
	});
});
