// ──────────────────────────────────────────────────────────────
// Enums (const arrays + derived union types)
// ──────────────────────────────────────────────────────────────

export const CANALES = ["TELEGRAM", "EMAIL", "DRIVE"] as const;
export type Canal = (typeof CANALES)[number];

export const TIPOS_DOCUMENTO = [
	"ESTADO_CUENTA",
	"VOUCHER",
	"FACTURA",
	"NOTIFICACION_CONSUMO",
	"OTRO",
] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const FORMATOS_DOCUMENTO = ["PDF", "IMAGEN", "EMAIL_HTML"] as const;
export type FormatoDocumento = (typeof FORMATOS_DOCUMENTO)[number];

export const ESTADOS_DOCUMENTO = [
	"RECIBIDO",
	"PROCESANDO",
	"NORMALIZADO",
	"ERROR",
] as const;
export type EstadoDocumento = (typeof ESTADOS_DOCUMENTO)[number];

export const STORAGE_TIERS = ["HOT", "ARCHIVE"] as const;
export type StorageTier = (typeof STORAGE_TIERS)[number];

export const TIPOS_ENTIDAD = ["BANCO", "FINTECH", "FINANCIERA"] as const;
export type TipoEntidad = (typeof TIPOS_ENTIDAD)[number];

export const TIPOS_CUENTA = [
	"AHORRO",
	"PLAZO_FIJO",
	"CTS",
	"CORRIENTE",
] as const;
export type TipoCuenta = (typeof TIPOS_CUENTA)[number];

export const MONEDAS = ["PEN", "USD"] as const;
export type Moneda = (typeof MONEDAS)[number];

export const TIPOS_PRODUCTO_CREDITO = [
	"VISA",
	"MASTERCARD",
	"AMEX",
	"DINERS",
] as const;
export type TipoProductoCredito = (typeof TIPOS_PRODUCTO_CREDITO)[number];

export const CATEGORIAS_TARJETA = [
	"CLASICA",
	"GOLD",
	"PLATINUM",
	"SIGNATURE",
	"INFINITE",
] as const;
export type CategoriaTarjeta = (typeof CATEGORIAS_TARJETA)[number];

export const FRECUENCIAS_MANTENIMIENTO = ["MENSUAL", "ANUAL"] as const;
export type FrecuenciaMantenimiento =
	(typeof FRECUENCIAS_MANTENIMIENTO)[number];

export const TIPOS_BENEFICIO = [
	"CASHBACK",
	"PUNTOS",
	"MILLAS",
	"NINGUNO",
] as const;
export type TipoBeneficio = (typeof TIPOS_BENEFICIO)[number];

export const ORIGENES_CATEGORIA = [
	"LLM_SUGERIDA",
	"USUARIO_CORREGIDA",
	"REGLA",
] as const;
export type OrigenCategoria = (typeof ORIGENES_CATEGORIA)[number];

export const ORIGENES_CATEGORIA_CREACION = [
	"LLM_SUGERIDA",
	"USUARIO_CREADA",
] as const;
export type OrigenCategoriaCreacion =
	(typeof ORIGENES_CATEGORIA_CREACION)[number];

export const TIPOS_PAGO = [
	"TARJETA",
	"EFECTIVO",
	"TRANSFERENCIA",
	"YAPE_PLIN",
] as const;
export type TipoPago = (typeof TIPOS_PAGO)[number];

export const ESTADOS_LOTE = [
	"EN_PROCESO",
	"COMPLETADO",
	"COMPLETADO_CON_ERRORES",
] as const;
export type EstadoLote = (typeof ESTADOS_LOTE)[number];

export const TIPOS_CONCILIACION = ["BANCARIA", "TRIBUTARIA"] as const;
export type TipoConciliacion = (typeof TIPOS_CONCILIACION)[number];

export const ESTADOS_CONCILIACION = [
	"PENDIENTE",
	"EN_PROCESO",
	"COMPLETADA",
] as const;
export type EstadoConciliacion = (typeof ESTADOS_CONCILIACION)[number];

export const FUENTES_DISCREPANCIA = ["FUENTE_A", "FUENTE_B"] as const;
export type FuenteDiscrepancia = (typeof FUENTES_DISCREPANCIA)[number];

export const TIPOS_DISCREPANCIA = [
	"SIN_MATCH",
	"MONTO_DIFERENTE",
	"FECHA_DIFERENTE",
] as const;
export type TipoDiscrepancia = (typeof TIPOS_DISCREPANCIA)[number];

export const ESTADOS_DISCREPANCIA = [
	"PENDIENTE",
	"RESUELTA",
	"IGNORADA",
] as const;
export type EstadoDiscrepancia = (typeof ESTADOS_DISCREPANCIA)[number];

// ──────────────────────────────────────────────────────────────
// Entity interfaces
// ──────────────────────────────────────────────────────────────

export interface EntidadFinanciera {
	readonly actualizado_en: string;
	readonly clave_descifrado: string;
	readonly creado_en: string;
	readonly id: string;
	readonly nombre: string;
	readonly patron_clave: string;
	readonly tipo: TipoEntidad;
}

export interface CuentaDeposito {
	readonly actualizado_en: string;
	readonly creado_en: string;
	readonly entidad_financiera_id: string;
	readonly id: string;
	readonly moneda: Moneda;
	readonly proposito: string | null;
	readonly saldo: number;
	readonly saldo_actualizado_en: string | null;
	readonly tasa_interes: number | null;
	readonly tipo: TipoCuenta;
}

export interface ProductoCredito {
	readonly activo: boolean;
	readonly actualizado_en: string;
	readonly categoria_tarjeta: CategoriaTarjeta;
	readonly creado_en: string;
	readonly cuota_mantenimiento: number | null;
	readonly entidad_financiera_id: string;
	readonly fecha_apertura: string;
	readonly fecha_corte: number;
	readonly fecha_pago: number;
	readonly fecha_renovacion: string | null;
	readonly frecuencia_mantenimiento: FrecuenciaMantenimiento | null;
	readonly id: string;
	readonly linea_credito: number;
	readonly moneda: Moneda;
	readonly periodo_contrato_meses: number | null;
	readonly programa_beneficios: string | null;
	readonly tasa_beneficio: string | null;
	readonly tasa_interes: number;
	readonly tipo: TipoProductoCredito;
	readonly tipo_beneficio: TipoBeneficio;
}

export interface Categoria {
	readonly activa: boolean;
	readonly categoria_sunat: string | null;
	readonly creado_en: string;
	readonly descripcion: string | null;
	readonly es_deducible_sunat: boolean;
	readonly id: string;
	readonly mergeada_en_id: string | null;
	readonly nombre: string;
	readonly origen: OrigenCategoriaCreacion;
}

export interface Lote {
	readonly canal: Canal;
	readonly cantidad_documentos: number;
	readonly completado_en: string | null;
	readonly creado_en: string;
	readonly estado: EstadoLote;
	readonly id: string;
}

export interface DocumentoFuente {
	readonly canal: Canal;
	readonly cifrado: boolean;
	readonly drive_file_id: string | null;
	readonly entidad_financiera_id: string | null;
	readonly error_detalle: string | null;
	readonly estado: EstadoDocumento;
	readonly formato: FormatoDocumento;
	readonly hash: string;
	readonly id: string;
	readonly lote_id: string | null;
	readonly nombre_archivo: string | null;
	readonly procesado_en: string | null;
	readonly producto_credito_id: string | null;
	readonly r2_key: string | null;
	readonly recibido_en: string;
	readonly storage_tier: StorageTier;
	readonly tipo: TipoDocumento;
}

export interface Transaccion {
	readonly categoria_id: string;
	readonly comercio: string;
	readonly comercio_ruc: string | null;
	readonly creado_en: string;
	readonly cuenta_deposito_id: string | null;
	readonly cuotas: number | null;
	readonly documento_fuente_id: string;
	readonly es_deducible_ir: boolean;
	readonly fecha: string;
	readonly id: string;
	readonly moneda: Moneda;
	readonly monto: number;
	readonly origen_categoria: OrigenCategoria;
	readonly producto_credito_id: string | null;
	readonly raw_data: string | null;
	readonly tipo_pago: TipoPago;
}

export interface ResumenEstadoCuenta {
	readonly cantidad_transacciones: number;
	readonly creado_en: string;
	readonly deuda_total: number;
	readonly documento_fuente_id: string;
	readonly fecha_pago: string;
	readonly id: string;
	readonly linea_disponible: number | null;
	readonly moneda: Moneda;
	readonly pago_minimo: number;
	readonly periodo_fin: string;
	readonly periodo_inicio: string;
	readonly producto_credito_id: string;
}

export interface Conciliacion {
	readonly creado_en: string;
	readonly ejecutada_en: string | null;
	readonly estado: EstadoConciliacion;
	readonly id: string;
	readonly periodo: string;
	readonly tipo: TipoConciliacion;
	readonly total_discrepancias: number;
	readonly total_matches: number;
	readonly total_registros_fuente_a: number;
	readonly total_registros_fuente_b: number;
}

export interface MatchConciliacion {
	readonly conciliacion_id: string;
	readonly confianza: number;
	readonly confirmado: boolean;
	readonly creado_en: string;
	readonly id: string;
	readonly registro_fuente_a_id: string;
	readonly registro_fuente_a_tipo: string;
	readonly registro_fuente_b_id: string;
	readonly registro_fuente_b_tipo: string;
}

export interface Discrepancia {
	readonly conciliacion_id: string;
	readonly creado_en: string;
	readonly estado: EstadoDiscrepancia;
	readonly fuente: FuenteDiscrepancia;
	readonly id: string;
	readonly registro_id: string;
	readonly registro_tipo: string;
	readonly resolucion: string | null;
	readonly resuelta_en: string | null;
	readonly tipo: TipoDiscrepancia;
}

// ──────────────────────────────────────────────────────────────
// Create input types (omit id, creado_en, actualizado_en)
// ──────────────────────────────────────────────────────────────

export interface CreateEntidadFinancieraInput {
	readonly clave_descifrado: string;
	readonly nombre: string;
	readonly patron_clave: string;
	readonly tipo: TipoEntidad;
}

export interface CreateCuentaDepositoInput {
	readonly entidad_financiera_id: string;
	readonly moneda: Moneda;
	readonly proposito?: string | null;
	readonly saldo?: number;
	readonly saldo_actualizado_en?: string | null;
	readonly tasa_interes?: number | null;
	readonly tipo: TipoCuenta;
}

export interface CreateProductoCreditoInput {
	readonly activo?: boolean;
	readonly categoria_tarjeta: CategoriaTarjeta;
	readonly cuota_mantenimiento?: number | null;
	readonly entidad_financiera_id: string;
	readonly fecha_apertura: string;
	readonly fecha_corte: number;
	readonly fecha_pago: number;
	readonly fecha_renovacion?: string | null;
	readonly frecuencia_mantenimiento?: FrecuenciaMantenimiento | null;
	readonly linea_credito: number;
	readonly moneda: Moneda;
	readonly periodo_contrato_meses?: number | null;
	readonly programa_beneficios?: string | null;
	readonly tasa_beneficio?: string | null;
	readonly tasa_interes: number;
	readonly tipo: TipoProductoCredito;
	readonly tipo_beneficio: TipoBeneficio;
}

export interface CreateCategoriaInput {
	readonly activa?: boolean;
	readonly categoria_sunat?: string | null;
	readonly descripcion?: string | null;
	readonly es_deducible_sunat?: boolean;
	readonly nombre: string;
	readonly origen: OrigenCategoriaCreacion;
}

export interface CreateLoteInput {
	readonly canal: Canal;
	readonly cantidad_documentos: number;
}

export interface CreateDocumentoFuenteInput {
	readonly canal: Canal;
	readonly cifrado?: boolean;
	readonly drive_file_id?: string | null;
	readonly entidad_financiera_id?: string | null;
	readonly error_detalle?: string | null;
	readonly estado?: EstadoDocumento;
	readonly formato: FormatoDocumento;
	readonly hash: string;
	readonly lote_id?: string | null;
	readonly nombre_archivo?: string | null;
	readonly producto_credito_id?: string | null;
	readonly r2_key?: string | null;
	readonly storage_tier?: StorageTier;
	readonly tipo: TipoDocumento;
}

export interface CreateTransaccionInput {
	readonly categoria_id: string;
	readonly comercio: string;
	readonly comercio_ruc?: string | null;
	readonly cuenta_deposito_id?: string | null;
	readonly cuotas?: number | null;
	readonly documento_fuente_id: string;
	readonly es_deducible_ir?: boolean;
	readonly fecha: string;
	readonly moneda: Moneda;
	readonly monto: number;
	readonly origen_categoria: OrigenCategoria;
	readonly producto_credito_id?: string | null;
	readonly raw_data?: string | null;
	readonly tipo_pago: TipoPago;
}

export interface CreateResumenEstadoCuentaInput {
	readonly cantidad_transacciones: number;
	readonly deuda_total: number;
	readonly documento_fuente_id: string;
	readonly fecha_pago: string;
	readonly linea_disponible?: number | null;
	readonly moneda: Moneda;
	readonly pago_minimo: number;
	readonly periodo_fin: string;
	readonly periodo_inicio: string;
	readonly producto_credito_id: string;
}

export interface CreateConciliacionInput {
	readonly periodo: string;
	readonly tipo: TipoConciliacion;
	readonly total_registros_fuente_a?: number;
	readonly total_registros_fuente_b?: number;
}

export interface CreateMatchConciliacionInput {
	readonly conciliacion_id: string;
	readonly confianza: number;
	readonly confirmado?: boolean;
	readonly registro_fuente_a_id: string;
	readonly registro_fuente_a_tipo: string;
	readonly registro_fuente_b_id: string;
	readonly registro_fuente_b_tipo: string;
}

export interface CreateDiscrepanciaInput {
	readonly conciliacion_id: string;
	readonly fuente: FuenteDiscrepancia;
	readonly registro_id: string;
	readonly registro_tipo: string;
	readonly tipo: TipoDiscrepancia;
}

// ──────────────────────────────────────────────────────────────
// Update input types (partial fields, id required)
// ──────────────────────────────────────────────────────────────

export interface UpdateEntidadFinancieraInput {
	readonly clave_descifrado?: string;
	readonly id: string;
	readonly nombre?: string;
	readonly patron_clave?: string;
	readonly tipo?: TipoEntidad;
}

export interface UpdateCuentaDepositoInput {
	readonly id: string;
	readonly moneda?: Moneda;
	readonly proposito?: string | null;
	readonly saldo?: number;
	readonly saldo_actualizado_en?: string | null;
	readonly tasa_interes?: number | null;
	readonly tipo?: TipoCuenta;
}

export interface UpdateProductoCreditoInput {
	readonly activo?: boolean;
	readonly categoria_tarjeta?: CategoriaTarjeta;
	readonly cuota_mantenimiento?: number | null;
	readonly fecha_corte?: number;
	readonly fecha_pago?: number;
	readonly fecha_renovacion?: string | null;
	readonly frecuencia_mantenimiento?: FrecuenciaMantenimiento | null;
	readonly id: string;
	readonly linea_credito?: number;
	readonly periodo_contrato_meses?: number | null;
	readonly programa_beneficios?: string | null;
	readonly tasa_beneficio?: string | null;
	readonly tasa_interes?: number;
	readonly tipo_beneficio?: TipoBeneficio;
}

export interface UpdateCategoriaInput {
	readonly activa?: boolean;
	readonly categoria_sunat?: string | null;
	readonly descripcion?: string | null;
	readonly es_deducible_sunat?: boolean;
	readonly id: string;
	readonly mergeada_en_id?: string | null;
	readonly nombre?: string;
}

export interface UpdateDocumentoFuenteInput {
	readonly drive_file_id?: string | null;
	readonly entidad_financiera_id?: string | null;
	readonly error_detalle?: string | null;
	readonly estado?: EstadoDocumento;
	readonly id: string;
	readonly procesado_en?: string | null;
	readonly producto_credito_id?: string | null;
	readonly r2_key?: string | null;
	readonly storage_tier?: StorageTier;
	readonly tipo?: TipoDocumento;
}

export interface UpdateLoteInput {
	readonly cantidad_documentos?: number;
	readonly completado_en?: string | null;
	readonly estado?: EstadoLote;
	readonly id: string;
}

export interface UpdateTransaccionInput {
	readonly categoria_id?: string;
	readonly es_deducible_ir?: boolean;
	readonly id: string;
	readonly origen_categoria?: OrigenCategoria;
}

export interface UpdateConciliacionInput {
	readonly ejecutada_en?: string | null;
	readonly estado?: EstadoConciliacion;
	readonly id: string;
	readonly total_discrepancias?: number;
	readonly total_matches?: number;
	readonly total_registros_fuente_a?: number;
	readonly total_registros_fuente_b?: number;
}

export interface UpdateMatchConciliacionInput {
	readonly confirmado?: boolean;
	readonly id: string;
}

export interface UpdateDiscrepanciaInput {
	readonly estado?: EstadoDiscrepancia;
	readonly id: string;
	readonly resolucion?: string | null;
	readonly resuelta_en?: string | null;
}

// ──────────────────────────────────────────────────────────────
// Filter type
// ──────────────────────────────────────────────────────────────

export interface TransactionFilter {
	readonly categorias?: string[];
	readonly comercio?: string;
	readonly cuentas?: string[];
	readonly es_deducible_ir?: boolean;
	readonly limit?: number;
	readonly moneda?: Moneda;
	readonly monto_maximo?: number;
	readonly monto_minimo?: number;
	readonly offset?: number;
	readonly periodo_fin?: string;
	readonly periodo_inicio?: string;
	readonly productos?: string[];
	readonly tipo_pago?: TipoPago;
}

// ──────────────────────────────────────────────────────────────
// Validation result
// ──────────────────────────────────────────────────────────────

export interface ValidationResult {
	readonly errors: string[];
	readonly valid: boolean;
}
