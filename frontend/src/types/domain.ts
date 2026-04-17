// Raw backend shapes (Spanish field names). These mirror what the Hono
// API returns for /documents, /conciliations, and /query. Kept separate
// from `@finanzas/shared-types` because the shared package exports the
// English DashboardData DTO; these routes don't have an adapter layer
// yet and return rows directly.

export type Canal = 'TELEGRAM' | 'EMAIL' | 'DRIVE';
export type TipoDocumento =
  | 'ESTADO_CUENTA'
  | 'VOUCHER'
  | 'FACTURA'
  | 'NOTIFICACION_CONSUMO'
  | 'OTRO';
export type EstadoDocumento =
  | 'RECIBIDO'
  | 'PROCESANDO'
  | 'NORMALIZADO'
  | 'ERROR';
export type StorageTier = 'HOT' | 'ARCHIVE';

export interface DocumentoFuente {
  id: string;
  canal: Canal;
  tipo: TipoDocumento;
  formato: 'PDF' | 'IMAGEN' | 'EMAIL_HTML';
  estado: EstadoDocumento;
  storage_tier: StorageTier;
  cifrado: boolean;
  hash: string;
  entidad_financiera_id: string | null;
  producto_credito_id: string | null;
  lote_id: string | null;
  nombre_archivo: string | null;
  drive_file_id: string | null;
  r2_key: string | null;
  recibido_en: string;
  procesado_en: string | null;
  error_detalle: string | null;
}

export type EstadoConciliacion =
  | 'EN_PROCESO'
  | 'COMPLETADA'
  | 'COMPLETADA_CON_DISCREPANCIAS';

export type TipoConciliacion =
  | 'TARJETA_VS_ESTADO_CUENTA'
  | 'CUENTA_VS_ESTADO_CUENTA'
  | 'ESTADO_CUENTA_VS_SUNAT';

export interface Conciliacion {
  id: string;
  tipo: TipoConciliacion;
  periodo: string;
  estado: EstadoConciliacion;
  total_registros_fuente_a: number;
  total_registros_fuente_b: number;
  total_matches: number;
  total_discrepancias: number;
  creado_en: string;
  ejecutada_en: string | null;
}

export interface MatchConciliacion {
  id: string;
  conciliacion_id: string;
  registro_fuente_a_id: string;
  registro_fuente_a_tipo: string;
  registro_fuente_b_id: string;
  registro_fuente_b_tipo: string;
  confianza: number;
  confirmado: boolean;
  creado_en: string;
}

export type EstadoDiscrepancia = 'PENDIENTE' | 'RESUELTA' | 'IGNORADA';
export type FuenteDiscrepancia = 'FUENTE_A' | 'FUENTE_B';
export type TipoDiscrepancia =
  | 'REGISTRO_SIN_MATCH'
  | 'DIFERENCIA_MONTO'
  | 'DIFERENCIA_FECHA';

export interface Discrepancia {
  id: string;
  conciliacion_id: string;
  registro_id: string;
  registro_tipo: string;
  tipo: TipoDiscrepancia;
  fuente: FuenteDiscrepancia;
  estado: EstadoDiscrepancia;
  resolucion: string | null;
  resuelta_en: string | null;
  creado_en: string;
}

export interface QueryAnswer {
  answer: string;
  data: Record<string, unknown>[] | null;
  sql: string | null;
  explanation: string;
  execution_time_ms: number | null;
}
