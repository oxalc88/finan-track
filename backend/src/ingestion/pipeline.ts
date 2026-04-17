import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import {
	create as createCategoria,
	findByNombre as findCategoriaByNombre,
	getActiveNames,
} from "../db/repositories/categories.js";
import {
	create as createDocumento,
	findByHash,
	update as updateDocumento,
	updateEstado,
} from "../db/repositories/documents.js";
import { findById as findEntidadById } from "../db/repositories/entities.js";
import {
	create as createResumen,
	findByProductoAndPeriodo,
} from "../db/repositories/statements.js";
import { create as createTransaccion } from "../db/repositories/transactions.js";
import {
	validateClaveDescifrado,
	validateEntidadParaEstadoCuenta,
	validateFechaDentroPeriodo,
	validateMontoNoCero,
	validateProductoParaEstadoCuenta,
} from "../domain/invariants.js";
import type {
	Canal,
	CreateTransaccionInput,
	TipoDocumento,
} from "../domain/types.js";
import { createR2Client, generateR2Key, uploadToR2 } from "../storage/r2.js";
import { extractTextFromPdf } from "./extract-pdf.js";
import { computeFileHash } from "./hash.js";
import { categorizeTransactions } from "./llm/categorize.js";
import {
	type ExtractionInput,
	extractTransactions,
} from "./llm/extract.js";
import type { ExtractionResult, RawTransaction } from "./llm/schemas.js";

export interface PipelineInput {
	readonly buffer: Buffer;
	readonly canal: Canal;
	readonly cifrado?: boolean;
	readonly entidad_financiera_id?: string;
	readonly formato?: "PDF" | "IMAGEN" | "EMAIL_HTML";
	readonly nombre_archivo?: string;
	readonly password?: string;
	readonly producto_credito_id?: string;
	readonly tipo?: TipoDocumento;
}

export interface PipelineResult {
	readonly categorias_nuevas: string[];
	readonly documento_id: string;
	readonly estado: "ERROR" | "NORMALIZADO";
	readonly transacciones_creadas: number;
	readonly warnings: string[];
}

export async function processDocument(
	db: Database.Database,
	input: PipelineInput
): Promise<PipelineResult> {
	const warnings: string[] = [];

	// Step 1-2: Hash + INV-01 idempotency
	const hash = computeFileHash(input.buffer);
	const existing = findByHash(db, hash);
	if (existing) {
		return {
			categorias_nuevas: [],
			documento_id: existing.id,
			estado: "NORMALIZADO",
			transacciones_creadas: 0,
			warnings: [`Documento duplicado: ya existe con id '${existing.id}'`],
		};
	}

	const password = resolvePassword(db, input);
	const cifrado = input.cifrado ?? (input.formato === "PDF" && !!password);
	const tipo = input.tipo ?? "OTRO";
	const formato = input.formato ?? "PDF";

	// Step 3: Create DocumentoFuente (RECIBIDO)
	const documento = createDocumento(db, {
		canal: input.canal,
		cifrado,
		entidad_financiera_id: input.entidad_financiera_id ?? null,
		formato,
		hash,
		nombre_archivo: input.nombre_archivo ?? null,
		producto_credito_id: input.producto_credito_id ?? null,
		tipo,
	});

	try {
		validateDocumentMetadata(tipo, input, cifrado, password, warnings);
		await uploadToStorage(db, documento.id, input.buffer, formato, warnings);
		updateEstado(db, documento.id, "PROCESANDO");

		const llmInput = await buildLlmInput(
			documento.id,
			input.buffer,
			formato,
			password
		);
		const { result: extractionResult, provider: extractProvider } =
			await extractTransactions(llmInput, tipo);
		if (extractionResult.transactions.length === 0) {
			throw new PipelineError("LLM extraction returned zero transactions");
		}
		warnings.push(`extraction_provider: ${extractProvider}`);

		const validTransactions = validateTransactions(
			extractionResult,
			tipo,
			warnings
		);
		if (validTransactions.length === 0) {
			throw new PipelineError(
				"All transactions failed validation after extraction"
			);
		}

		const existingCategories = getActiveNames(db);
		const { result: categorization, provider: catProvider } =
			await categorizeTransactions(validTransactions, existingCategories);
		warnings.push(`categorization_provider: ${catProvider}`);

		const categoriasNuevas: string[] = [];
		const transaccionesCreadas = persistResults(
			db,
			documento.id,
			input,
			validTransactions,
			categorization,
			extractionResult,
			tipo,
			categoriasNuevas,
			warnings
		);

		updateEstado(db, documento.id, "NORMALIZADO");

		return {
			categorias_nuevas: categoriasNuevas,
			documento_id: documento.id,
			estado: "NORMALIZADO",
			transacciones_creadas: transaccionesCreadas,
			warnings,
		};
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown pipeline error";
		updateEstado(db, documento.id, "ERROR", errorMessage);
		return {
			categorias_nuevas: [],
			documento_id: documento.id,
			estado: "ERROR",
			transacciones_creadas: 0,
			warnings: [...warnings, errorMessage],
		};
	}
}

class PipelineError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PipelineError";
	}
}

function resolvePassword(
	db: Database.Database,
	input: PipelineInput
): string | undefined {
	if (input.password) {
		return input.password;
	}
	if (input.entidad_financiera_id) {
		const entidad = findEntidadById(db, input.entidad_financiera_id);
		if (entidad?.clave_descifrado) {
			return entidad.clave_descifrado;
		}
	}
	return undefined;
}

function validateDocumentMetadata(
	tipo: TipoDocumento,
	input: PipelineInput,
	cifrado: boolean,
	password: string | undefined,
	warnings: string[]
): void {
	const inv11 = validateEntidadParaEstadoCuenta(
		tipo,
		input.entidad_financiera_id
	);
	if (!inv11.valid) {
		warnings.push(...inv11.errors);
	}
	const inv12 = validateProductoParaEstadoCuenta(
		tipo,
		input.producto_credito_id
	);
	if (!inv12.valid) {
		warnings.push(...inv12.errors);
	}
	if (cifrado) {
		const inv06 = validateClaveDescifrado(cifrado, password ?? "");
		if (!inv06.valid) {
			throw new PipelineError(inv06.errors.join("; "));
		}
	}
}

async function uploadToStorage(
	db: Database.Database,
	documentoId: string,
	buffer: Buffer,
	formato: "PDF" | "IMAGEN" | "EMAIL_HTML",
	warnings: string[]
): Promise<void> {
	try {
		const r2Client = createR2Client();
		const r2Key = generateR2Key(
			new Date(),
			documentoId,
			formatExtension(formato)
		);
		await uploadToR2(r2Client, r2Key, buffer, mimeType(formato));
		updateDocumento(db, { id: documentoId, r2_key: r2Key });
	} catch (err) {
		warnings.push(
			`R2 upload failed: ${err instanceof Error ? err.message : "unknown error"}`
		);
	}
}

async function buildLlmInput(
	documentoId: string,
	buffer: Buffer,
	formato: "PDF" | "IMAGEN" | "EMAIL_HTML",
	password: string | undefined
): Promise<ExtractionInput> {
	if (formato === "IMAGEN") {
		return { kind: "image", buffer };
	}

	let text: string;
	if (formato === "PDF") {
		const tmpPath = join(tmpdir(), `finanzas-${documentoId}.pdf`);
		await writeFile(tmpPath, buffer);
		const extraction = await extractTextFromPdf(tmpPath, password);
		text = extraction.text;
	} else {
		text = buffer.toString("utf-8");
	}
	if (!text.trim()) {
		throw new PipelineError("No text could be extracted from document");
	}
	return { kind: "text", text };
}

function validateTransactions(
	extractionResult: ExtractionResult,
	tipo: TipoDocumento,
	warnings: string[]
): RawTransaction[] {
	const valid: RawTransaction[] = [];
	for (const raw of extractionResult.transactions) {
		const montoCentavos = Math.round(raw.monto * 100);
		const inv10 = validateMontoNoCero(montoCentavos);
		if (!inv10.valid) {
			warnings.push(
				`Transaction skipped (${raw.comercio}): ${inv10.errors.join("; ")}`
			);
			continue;
		}
		if (
			tipo === "ESTADO_CUENTA" &&
			extractionResult.periodo_inicio &&
			extractionResult.periodo_fin
		) {
			const inv13 = validateFechaDentroPeriodo(
				raw.fecha,
				extractionResult.periodo_inicio,
				extractionResult.periodo_fin
			);
			if (!inv13.valid) {
				warnings.push(
					`Transaction date warning (${raw.comercio}): ${inv13.errors.join("; ")}`
				);
			}
		}
		valid.push(raw);
	}
	return valid;
}

function persistResults(
	db: Database.Database,
	documentoId: string,
	input: PipelineInput,
	validTransactions: RawTransaction[],
	categorization: {
		assignments: Array<{
			index: number;
			categoria: string;
			es_nueva: boolean;
			confianza: number;
		}>;
	},
	extractionResult: ExtractionResult,
	tipo: TipoDocumento,
	categoriasNuevas: string[],
	warnings: string[]
): number {
	const doTransaction = db.transaction(() => {
		const categoryMap = resolveCategoryMap(
			db,
			categorization.assignments,
			validTransactions.length,
			categoriasNuevas
		);
		const createdCount = createTransactions(
			db,
			documentoId,
			input,
			validTransactions,
			categoryMap,
			warnings
		);
		createStatementIfNeeded(
			db,
			documentoId,
			input,
			extractionResult,
			tipo,
			createdCount,
			validTransactions,
			warnings
		);
		return createdCount;
	});
	return doTransaction();
}

function resolveCategoryMap(
	db: Database.Database,
	assignments: Array<{
		index: number;
		categoria: string;
		es_nueva: boolean;
		confianza: number;
	}>,
	maxIndex: number,
	categoriasNuevas: string[]
): Map<number, string> {
	const categoryMap = new Map<number, string>();
	for (const assignment of assignments) {
		if (assignment.index < 0 || assignment.index >= maxIndex) {
			continue;
		}
		let categoria = findCategoriaByNombre(db, assignment.categoria);
		if (!categoria) {
			categoria = createCategoria(db, {
				nombre: assignment.categoria,
				origen: "LLM_SUGERIDA",
			});
			categoriasNuevas.push(assignment.categoria);
		}
		categoryMap.set(assignment.index, categoria.id);
	}
	return categoryMap;
}

function createTransactions(
	db: Database.Database,
	documentoId: string,
	input: PipelineInput,
	validTransactions: RawTransaction[],
	categoryMap: Map<number, string>,
	warnings: string[]
): number {
	let createdCount = 0;
	for (let i = 0; i < validTransactions.length; i++) {
		const raw = validTransactions[i];
		const categoriaId = categoryMap.get(i);
		if (!categoriaId) {
			warnings.push(
				`Transaction skipped (${raw.comercio}): no category assigned`
			);
			continue;
		}
		const txInput: CreateTransaccionInput = {
			categoria_id: categoriaId,
			comercio: raw.comercio,
			comercio_ruc: raw.comercio_ruc ?? null,
			cuenta_deposito_id: null,
			cuotas: raw.cuotas ?? null,
			documento_fuente_id: documentoId,
			fecha: raw.fecha,
			moneda: raw.moneda,
			monto: Math.round(raw.monto * 100),
			origen_categoria: "LLM_SUGERIDA",
			producto_credito_id: input.producto_credito_id ?? null,
			raw_data: JSON.stringify(raw),
			tipo_pago: raw.tipo_pago,
		};
		createTransaccion(db, txInput);
		createdCount++;
	}
	return createdCount;
}

function createStatementIfNeeded(
	db: Database.Database,
	documentoId: string,
	input: PipelineInput,
	extractionResult: ExtractionResult,
	tipo: TipoDocumento,
	createdCount: number,
	validTransactions: RawTransaction[],
	warnings: string[]
): void {
	if (
		tipo !== "ESTADO_CUENTA" ||
		!input.producto_credito_id ||
		!extractionResult.periodo_inicio ||
		!extractionResult.periodo_fin
	) {
		return;
	}
	const existingResumen = findByProductoAndPeriodo(
		db,
		input.producto_credito_id,
		extractionResult.periodo_inicio,
		extractionResult.periodo_fin
	);
	if (existingResumen) {
		warnings.push(
			`Statement summary already exists for product ${input.producto_credito_id} period ${extractionResult.periodo_inicio} - ${extractionResult.periodo_fin}`
		);
		return;
	}
	createResumen(db, {
		cantidad_transacciones: createdCount,
		deuda_total: Math.round((extractionResult.deuda_total ?? 0) * 100),
		documento_fuente_id: documentoId,
		fecha_pago: extractionResult.fecha_pago ?? extractionResult.periodo_fin,
		linea_disponible: extractionResult.linea_disponible
			? Math.round(extractionResult.linea_disponible * 100)
			: null,
		moneda: validTransactions[0]?.moneda ?? "PEN",
		pago_minimo: Math.round((extractionResult.pago_minimo ?? 0) * 100),
		periodo_fin: extractionResult.periodo_fin,
		periodo_inicio: extractionResult.periodo_inicio,
		producto_credito_id: input.producto_credito_id,
	});
}

function formatExtension(formato: "PDF" | "IMAGEN" | "EMAIL_HTML"): string {
	switch (formato) {
		case "PDF":
			return "pdf";
		case "IMAGEN":
			return "jpg";
		case "EMAIL_HTML":
			return "html";
		default:
			return "bin";
	}
}

function mimeType(formato: "PDF" | "IMAGEN" | "EMAIL_HTML"): string {
	switch (formato) {
		case "PDF":
			return "application/pdf";
		case "IMAGEN":
			return "image/jpeg";
		case "EMAIL_HTML":
			return "text/html";
		default:
			return "application/octet-stream";
	}
}
