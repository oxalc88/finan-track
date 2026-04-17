import type {
	Canal,
	EstadoDocumento,
	FormatoDocumento,
	FuenteDiscrepancia,
	Moneda,
	OrigenCategoria,
	TipoConciliacion,
	TipoDiscrepancia,
	TipoDocumento,
	TipoProductoCredito,
} from "./types.js";

// ──────────────────────────────────────────────────────────────
// Base event shape
// ──────────────────────────────────────────────────────────────

interface BaseEvent<T extends string> {
	readonly timestamp: string;
	readonly type: T;
}

// ──────────────────────────────────────────────────────────────
// Ingesta events
// ──────────────────────────────────────────────────────────────

export interface DocumentoRecibidoEvent extends BaseEvent<"DocumentoRecibido"> {
	readonly canal: Canal;
	readonly cifrado: boolean;
	readonly documento_id: string;
	readonly formato: FormatoDocumento;
	readonly lote_id: string | null;
}

export interface DocumentoDescifradoEvent
	extends BaseEvent<"DocumentoDescifrado"> {
	readonly documento_id: string;
	readonly entidad_financiera_id: string;
}

export interface DocumentoDescifradoFallidoEvent
	extends BaseEvent<"DocumentoDescifradoFallido"> {
	readonly documento_id: string;
	readonly entidad_financiera_id: string;
	readonly error_detalle: string;
}

export interface DocumentoClasificadoEvent
	extends BaseEvent<"DocumentoClasificado"> {
	readonly documento_id: string;
	readonly entidad_financiera_id: string | null;
	readonly producto_credito_id: string | null;
	readonly tipo: TipoDocumento;
}

export interface ExtraccionCompletadaEvent
	extends BaseEvent<"ExtraccionCompletada"> {
	readonly cantidad_registros: number;
	readonly confianza: number;
	readonly documento_id: string;
	readonly metodo_extraccion: string;
}

export interface ExtraccionFallidaEvent extends BaseEvent<"ExtraccionFallida"> {
	readonly documento_id: string;
	readonly error_detalle: string;
	readonly metodo_extraccion: string;
}

export interface TransaccionNormalizadaEvent
	extends BaseEvent<"TransaccionNormalizada"> {
	readonly comercio: string;
	readonly documento_id: string;
	readonly fecha: string;
	readonly moneda: Moneda;
	readonly monto: number;
	readonly transaccion_id: string;
}

export interface ResumenEstadoCuentaExtraidoEvent
	extends BaseEvent<"ResumenEstadoCuentaExtraido"> {
	readonly deuda_total: number;
	readonly pago_minimo: number;
	readonly periodo_fin: string;
	readonly periodo_inicio: string;
	readonly producto_credito_id: string;
	readonly resumen_id: string;
}

export interface DocumentoNormalizadoEvent
	extends BaseEvent<"DocumentoNormalizado"> {
	readonly cantidad_transacciones: number;
	readonly documento_id: string;
	readonly resumen_id: string | null;
}

export interface DocumentoErrorEvent extends BaseEvent<"DocumentoError"> {
	readonly documento_id: string;
	readonly error_detalle: string;
	readonly estado_anterior: EstadoDocumento;
}

export interface DuplicadoDetectadoEvent
	extends BaseEvent<"DuplicadoDetectado"> {
	readonly documento_id_existente: string;
	readonly documento_id_nuevo: string;
	readonly hash: string;
}

export interface LoteCompletadoEvent extends BaseEvent<"LoteCompletado"> {
	readonly con_error: number;
	readonly exitosos: number;
	readonly lote_id: string;
	readonly total_documentos: number;
}

// ──────────────────────────────────────────────────────────────
// Categoria events
// ──────────────────────────────────────────────────────────────

export interface CategoriaSolicitadaEvent
	extends BaseEvent<"CategoriaSolicitada"> {
	readonly comercio: string;
	readonly monto: number;
	readonly raw_data: string | null;
	readonly transaccion_id: string;
}

export interface CategoriaAsignadaEvent extends BaseEvent<"CategoriaAsignada"> {
	readonly categoria_id: string;
	readonly origen_categoria: OrigenCategoria;
	readonly transaccion_id: string;
}

export interface CategoriaNuevaCreadaEvent
	extends BaseEvent<"CategoriaNuevaCreada"> {
	readonly categoria_id: string;
	readonly nombre: string;
	readonly sugerida_por_transaccion_id: string;
}

export interface CategoriasMergeadasEvent
	extends BaseEvent<"CategoriasMergeadas"> {
	readonly categoria_absorbida_id: string;
	readonly categoria_destino_id: string;
	readonly transacciones_reasignadas: number;
}

// ──────────────────────────────────────────────────────────────
// Conciliacion events
// ──────────────────────────────────────────────────────────────

export interface ConciliacionIniciadaEvent
	extends BaseEvent<"ConciliacionIniciada"> {
	readonly conciliacion_id: string;
	readonly periodo: string;
	readonly tipo: TipoConciliacion;
}

export interface ConciliacionCompletadaEvent
	extends BaseEvent<"ConciliacionCompletada"> {
	readonly conciliacion_id: string;
	readonly total_discrepancias: number;
	readonly total_matches: number;
}

export interface DiscrepanciaDetectadaEvent
	extends BaseEvent<"DiscrepanciaDetectada"> {
	readonly conciliacion_id: string;
	readonly discrepancia_id: string;
	readonly fuente: FuenteDiscrepancia;
	readonly registro_id: string;
	readonly tipo: TipoDiscrepancia;
}

export interface DiscrepanciaResueltaEvent
	extends BaseEvent<"DiscrepanciaResuelta"> {
	readonly discrepancia_id: string;
	readonly resolucion: string;
}

// ──────────────────────────────────────────────────────────────
// Configuracion events
// ──────────────────────────────────────────────────────────────

export interface SaldoActualizadoEvent extends BaseEvent<"SaldoActualizado"> {
	readonly cuenta_deposito_id: string;
	readonly saldo_anterior: number;
	readonly saldo_nuevo: number;
}

export interface ProductoCreditoRegistradoEvent
	extends BaseEvent<"ProductoCreditoRegistrado"> {
	readonly entidad_financiera_id: string;
	readonly producto_credito_id: string;
	readonly tipo: TipoProductoCredito;
}

// ──────────────────────────────────────────────────────────────
// Discriminated union
// ──────────────────────────────────────────────────────────────

export type DomainEvent =
	| DocumentoRecibidoEvent
	| DocumentoDescifradoEvent
	| DocumentoDescifradoFallidoEvent
	| DocumentoClasificadoEvent
	| ExtraccionCompletadaEvent
	| ExtraccionFallidaEvent
	| TransaccionNormalizadaEvent
	| ResumenEstadoCuentaExtraidoEvent
	| DocumentoNormalizadoEvent
	| DocumentoErrorEvent
	| DuplicadoDetectadoEvent
	| LoteCompletadoEvent
	| CategoriaSolicitadaEvent
	| CategoriaAsignadaEvent
	| CategoriaNuevaCreadaEvent
	| CategoriasMergeadasEvent
	| ConciliacionIniciadaEvent
	| ConciliacionCompletadaEvent
	| DiscrepanciaDetectadaEvent
	| DiscrepanciaResueltaEvent
	| SaldoActualizadoEvent
	| ProductoCreditoRegistradoEvent;

// ──────────────────────────────────────────────────────────────
// Event type string literal union (for discriminating)
// ──────────────────────────────────────────────────────────────

export type DomainEventType = DomainEvent["type"];

// ──────────────────────────────────────────────────────────────
// Payload extraction type
// Maps event type string to its payload (all fields except type & timestamp)
// ──────────────────────────────────────────────────────────────

type EventPayload<T extends DomainEventType> = Omit<
	Extract<DomainEvent, { type: T }>,
	"type" | "timestamp"
>;

// ──────────────────────────────────────────────────────────────
// Factory function
// ──────────────────────────────────────────────────────────────

export function createEvent<T extends DomainEventType>(
	type: T,
	payload: EventPayload<T>
): Extract<DomainEvent, { type: T }> {
	return {
		type,
		timestamp: new Date().toISOString(),
		...payload,
	} as Extract<DomainEvent, { type: T }>;
}
