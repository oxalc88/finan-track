import type {
	EstadoConciliacion,
	EstadoDiscrepancia,
	EstadoDocumento,
	EstadoLote,
	ValidationResult,
} from "./types.js";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const ok = (): ValidationResult => ({ valid: true, errors: [] });
const fail = (error: string): ValidationResult => ({
	valid: false,
	errors: [error],
});

// ──────────────────────────────────────────────────────────────
// INV-01 — Idempotencia de ingesta
// Un documento con el mismo hash no se procesa dos veces.
// ──────────────────────────────────────────────────────────────

export function validateDocumentIdempotency(
	hash: string,
	existingHashes: string[]
): ValidationResult {
	if (existingHashes.includes(hash)) {
		return fail(
			`Documento duplicado: ya existe un documento con hash '${hash}'`
		);
	}
	return ok();
}

// ──────────────────────────────────────────────────────────────
// INV-02 — Documento fuente obligatorio
// Toda transaccion debe tener un documento fuente asociado.
// ──────────────────────────────────────────────────────────────

export function validateDocumentoFuenteRequired(
	documentoFuenteId: string | null | undefined
): ValidationResult {
	if (!documentoFuenteId) {
		return fail(
			"Documento fuente obligatorio: toda transaccion debe tener un documento fuente asociado"
		);
	}
	return ok();
}

// ──────────────────────────────────────────────────────────────
// INV-03 — Categoria requerida post-normalizacion
// Toda transaccion normalizada debe tener una categoria.
// ──────────────────────────────────────────────────────────────

export function validateCategoriaRequired(
	categoriaId: string | null | undefined
): ValidationResult {
	if (!categoriaId) {
		return fail(
			"Categoria requerida: toda transaccion normalizada debe tener una categoria asignada"
		);
	}
	return ok();
}

// ──────────────────────────────────────────────────────────────
// INV-04 — Unicidad de categoria por nombre (case-insensitive)
// No pueden existir dos categorias activas con el mismo nombre.
// ──────────────────────────────────────────────────────────────

export function validateCategoriaNombreUnico(
	nombre: string,
	existingNames: string[]
): ValidationResult {
	const normalizado = nombre.toLowerCase();
	const duplicado = existingNames.some(
		(name) => name.toLowerCase() === normalizado
	);
	if (duplicado) {
		return fail(
			`Categoria duplicada: ya existe una categoria activa con nombre '${nombre}' (case-insensitive)`
		);
	}
	return ok();
}

// ──────────────────────────────────────────────────────────────
// INV-05 — Merge de categoria preserva historial
// No se puede mergear una categoria consigo misma.
// ──────────────────────────────────────────────────────────────

export function validateMergeCategoria(
	sourceId: string,
	targetId: string
): ValidationResult {
	if (sourceId === targetId) {
		return fail(
			"Merge invalido: no se puede mergear una categoria consigo misma"
		);
	}
	return ok();
}

// ──────────────────────────────────────────────────────────────
// INV-06 — Clave de descifrado por entidad
// Si el documento es cifrado, debe existir clave configurada.
// ──────────────────────────────────────────────────────────────

export function validateClaveDescifrado(
	cifrado: boolean,
	claveDescifrado: string
): ValidationResult {
	if (cifrado && !claveDescifrado) {
		return fail(
			"Clave de descifrado requerida: el documento es cifrado pero no hay clave configurada para la entidad financiera"
		);
	}
	return ok();
}

// ──────────────────────────────────────────────────────────────
// INV-07 — Un registro participa en maximo un match por conciliacion
// Dentro de una misma conciliacion, un registro es 1:1.
// ──────────────────────────────────────────────────────────────

export function validateMatchUnico(
	registroId: string,
	existingMatchedIds: string[]
): ValidationResult {
	if (existingMatchedIds.includes(registroId)) {
		return fail(
			`Match duplicado: el registro '${registroId}' ya participa en un match dentro de esta conciliacion`
		);
	}
	return ok();
}

// ──────────────────────────────────────────────────────────────
// INV-08 — Conciliacion requiere ambas fuentes
// No se puede ejecutar si alguna fuente tiene cero registros.
// ──────────────────────────────────────────────────────────────

export function validateConciliacionFuentes(
	totalFuenteA: number,
	totalFuenteB: number
): ValidationResult {
	const errors: string[] = [];

	if (totalFuenteA <= 0) {
		errors.push(
			"Conciliacion requiere registros en fuente A: no hay registros disponibles"
		);
	}
	if (totalFuenteB <= 0) {
		errors.push(
			"Conciliacion requiere registros en fuente B: no hay registros disponibles"
		);
	}

	return errors.length > 0 ? { valid: false, errors } : ok();
}

// ──────────────────────────────────────────────────────────────
// INV-09 — Discrepancia resuelta requiere resolucion
// No puede pasar a RESUELTA sin texto de resolucion.
// ──────────────────────────────────────────────────────────────

export function validateDiscrepanciaResolucion(
	estado: string,
	resolucion: string | null | undefined
): ValidationResult {
	if (estado === "RESUELTA" && !resolucion) {
		return fail(
			"Resolucion requerida: una discrepancia no puede marcarse como RESUELTA sin texto de resolucion"
		);
	}
	return ok();
}

// ──────────────────────────────────────────────────────────────
// INV-10 — Monto no puede ser cero
// Toda transaccion debe tener un monto distinto de cero.
// ──────────────────────────────────────────────────────────────

export function validateMontoNoCero(monto: number): ValidationResult {
	if (monto === 0) {
		return fail("Monto invalido: el monto de la transaccion no puede ser cero");
	}
	return ok();
}

// ──────────────────────────────────────────────────────────────
// INV-11 — Entidad financiera requerida para estados de cuenta
// Documentos ESTADO_CUENTA o NOTIFICACION_CONSUMO requieren entidad.
// ──────────────────────────────────────────────────────────────

export function validateEntidadParaEstadoCuenta(
	tipoDocumento: string,
	entidadFinancieraId: string | null | undefined
): ValidationResult {
	const requiereEntidad =
		tipoDocumento === "ESTADO_CUENTA" ||
		tipoDocumento === "NOTIFICACION_CONSUMO";

	if (requiereEntidad && !entidadFinancieraId) {
		return fail(
			`Entidad financiera requerida: un documento de tipo '${tipoDocumento}' debe tener entidad financiera asociada`
		);
	}
	return ok();
}

// ──────────────────────────────────────────────────────────────
// INV-12 — Producto de credito requerido para estado de cuenta de tarjeta
// Un ESTADO_CUENTA debe estar asociado a un producto de credito.
// ──────────────────────────────────────────────────────────────

export function validateProductoParaEstadoCuenta(
	tipoDocumento: string,
	productoCreditoId: string | null | undefined
): ValidationResult {
	if (tipoDocumento === "ESTADO_CUENTA" && !productoCreditoId) {
		return fail(
			"Producto de credito requerido: un documento de tipo 'ESTADO_CUENTA' debe estar asociado a un producto de credito"
		);
	}
	return ok();
}

// ──────────────────────────────────────────────────────────────
// INV-13 — Fecha de transaccion dentro del periodo
// La fecha debe estar dentro de periodo_inicio y periodo_fin.
// ──────────────────────────────────────────────────────────────

export function validateFechaDentroPeriodo(
	fecha: string,
	periodoInicio: string,
	periodoFin: string
): ValidationResult {
	if (fecha < periodoInicio || fecha > periodoFin) {
		return fail(
			`Fecha fuera de periodo: '${fecha}' no esta dentro del rango [${periodoInicio}, ${periodoFin}]`
		);
	}
	return ok();
}

// ──────────────────────────────────────────────────────────────
// INV-14 — Resumen de estado de cuenta unico por producto y periodo
// No puede existir mas de un resumen para el mismo producto + periodo.
// ──────────────────────────────────────────────────────────────

export function validateResumenUnico(
	productoCreditoId: string,
	periodoInicio: string,
	periodoFin: string,
	existingResumenes: Array<{
		producto_credito_id: string;
		periodo_inicio: string;
		periodo_fin: string;
	}>
): ValidationResult {
	const duplicado = existingResumenes.some(
		(r) =>
			r.producto_credito_id === productoCreditoId &&
			r.periodo_inicio === periodoInicio &&
			r.periodo_fin === periodoFin
	);

	if (duplicado) {
		return fail(
			`Resumen duplicado: ya existe un resumen para el producto '${productoCreditoId}' en el periodo [${periodoInicio}, ${periodoFin}]`
		);
	}
	return ok();
}

// ──────────────────────────────────────────────────────────────
// State machine transition validators
// ──────────────────────────────────────────────────────────────

const VALID_DOCUMENTO_TRANSITIONS: ReadonlyMap<
	EstadoDocumento,
	readonly EstadoDocumento[]
> = new Map([
	["RECIBIDO", ["PROCESANDO"]],
	["PROCESANDO", ["NORMALIZADO", "ERROR"]],
	["ERROR", ["PROCESANDO"]],
	["NORMALIZADO", []],
]);

export function validateDocumentoTransition(
	currentState: EstadoDocumento,
	nextState: EstadoDocumento
): ValidationResult {
	const allowed = VALID_DOCUMENTO_TRANSITIONS.get(currentState) ?? [];
	if (!allowed.includes(nextState)) {
		return fail(
			`Transicion de documento invalida: no se puede pasar de '${currentState}' a '${nextState}'`
		);
	}
	return ok();
}

const VALID_LOTE_TRANSITIONS: ReadonlyMap<EstadoLote, readonly EstadoLote[]> =
	new Map([
		["EN_PROCESO", ["COMPLETADO", "COMPLETADO_CON_ERRORES"]],
		["COMPLETADO", []],
		["COMPLETADO_CON_ERRORES", []],
	]);

export function validateLoteTransition(
	currentState: EstadoLote,
	nextState: EstadoLote
): ValidationResult {
	const allowed = VALID_LOTE_TRANSITIONS.get(currentState) ?? [];
	if (!allowed.includes(nextState)) {
		return fail(
			`Transicion de lote invalida: no se puede pasar de '${currentState}' a '${nextState}'`
		);
	}
	return ok();
}

const VALID_CONCILIACION_TRANSITIONS: ReadonlyMap<
	EstadoConciliacion,
	readonly EstadoConciliacion[]
> = new Map([
	["PENDIENTE", ["EN_PROCESO"]],
	["EN_PROCESO", ["COMPLETADA"]],
	["COMPLETADA", []],
]);

export function validateConciliacionTransition(
	currentState: EstadoConciliacion,
	nextState: EstadoConciliacion
): ValidationResult {
	const allowed = VALID_CONCILIACION_TRANSITIONS.get(currentState) ?? [];
	if (!allowed.includes(nextState)) {
		return fail(
			`Transicion de conciliacion invalida: no se puede pasar de '${currentState}' a '${nextState}'`
		);
	}
	return ok();
}

const VALID_DISCREPANCIA_TRANSITIONS: ReadonlyMap<
	EstadoDiscrepancia,
	readonly EstadoDiscrepancia[]
> = new Map([
	["PENDIENTE", ["RESUELTA", "IGNORADA"]],
	["RESUELTA", []],
	["IGNORADA", []],
]);

export function validateDiscrepanciaTransition(
	currentState: EstadoDiscrepancia,
	nextState: EstadoDiscrepancia
): ValidationResult {
	const allowed = VALID_DISCREPANCIA_TRANSITIONS.get(currentState) ?? [];
	if (!allowed.includes(nextState)) {
		return fail(
			`Transicion de discrepancia invalida: no se puede pasar de '${currentState}' a '${nextState}'`
		);
	}
	return ok();
}
