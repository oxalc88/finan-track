import { describe, expect, it } from "vitest";
import { createEvent } from "../../src/domain/events.js";

const ISO_8601_UTC_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/;

describe("createEvent", () => {
	it("sets the correct type field", () => {
		const event = createEvent("DocumentoRecibido", {
			documento_id: "doc-001",
			canal: "TELEGRAM",
			formato: "PDF",
			cifrado: false,
			lote_id: null,
		});

		expect(event.type).toBe("DocumentoRecibido");
	});

	it("produces a valid ISO 8601 UTC timestamp", () => {
		const event = createEvent("DocumentoRecibido", {
			documento_id: "doc-001",
			canal: "EMAIL",
			formato: "EMAIL_HTML",
			cifrado: false,
			lote_id: null,
		});

		// ISO 8601 UTC: ends with Z, parseable
		expect(event.timestamp).toMatch(ISO_8601_UTC_REGEX);
		expect(Number.isNaN(Date.parse(event.timestamp))).toBe(false);
	});

	it("timestamp is close to current time", () => {
		const before = Date.now();
		const event = createEvent("SaldoActualizado", {
			cuenta_deposito_id: "cta-001",
			saldo_anterior: 10_000,
			saldo_nuevo: 15_000,
		});
		const after = Date.now();

		const ts = Date.parse(event.timestamp);
		expect(ts).toBeGreaterThanOrEqual(before);
		expect(ts).toBeLessThanOrEqual(after);
	});

	it("preserves all payload fields", () => {
		const event = createEvent("LoteCompletado", {
			lote_id: "lote-001",
			total_documentos: 5,
			exitosos: 4,
			con_error: 1,
		});

		expect(event.lote_id).toBe("lote-001");
		expect(event.total_documentos).toBe(5);
		expect(event.exitosos).toBe(4);
		expect(event.con_error).toBe(1);
	});

	it("each call produces a distinct timestamp object", () => {
		const e1 = createEvent("DocumentoRecibido", {
			documento_id: "doc-001",
			canal: "DRIVE",
			formato: "PDF",
			cifrado: true,
			lote_id: "lote-abc",
		});
		const e2 = createEvent("DocumentoRecibido", {
			documento_id: "doc-002",
			canal: "DRIVE",
			formato: "PDF",
			cifrado: false,
			lote_id: null,
		});

		// They are distinct objects
		expect(e1).not.toBe(e2);
		expect(e1.documento_id).toBe("doc-001");
		expect(e2.documento_id).toBe("doc-002");
	});

	it("preserves nullable payload fields", () => {
		const event = createEvent("DocumentoClasificado", {
			documento_id: "doc-001",
			tipo: "VOUCHER",
			entidad_financiera_id: null,
			producto_credito_id: null,
		});

		expect(event.entidad_financiera_id).toBeNull();
		expect(event.producto_credito_id).toBeNull();
	});

	it("works for conciliation events with numeric fields", () => {
		const event = createEvent("ConciliacionCompletada", {
			conciliacion_id: "conc-001",
			total_matches: 42,
			total_discrepancias: 3,
		});

		expect(event.type).toBe("ConciliacionCompletada");
		expect(event.total_matches).toBe(42);
		expect(event.total_discrepancias).toBe(3);
	});
});
