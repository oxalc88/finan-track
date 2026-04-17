import { z } from 'zod';

const TipoProductoCredito = z.enum(['VISA', 'MASTERCARD', 'AMEX', 'DINERS']);
const CategoriaTarjeta = z.enum([
  'CLASICA',
  'GOLD',
  'PLATINUM',
  'SIGNATURE',
  'INFINITE',
]);
const FrecuenciaMantenimiento = z.enum(['MENSUAL', 'ANUAL']);
const TipoBeneficio = z.enum(['CASHBACK', 'PUNTOS', 'MILLAS', 'NINGUNO']);
const Moneda = z.enum(['PEN', 'USD']);

export const CreateProductSchema = z.object({
  entidad_financiera_id: z.string().min(1),
  tipo: TipoProductoCredito,
  categoria_tarjeta: CategoriaTarjeta,
  linea_credito: z.number().int().nonnegative(),
  moneda: Moneda,
  fecha_corte: z.number().int().min(1).max(31),
  fecha_pago: z.number().int().min(1).max(31),
  tasa_interes: z.number(),
  cuota_mantenimiento: z.number().nullable().optional(),
  frecuencia_mantenimiento: FrecuenciaMantenimiento.nullable().optional(),
  fecha_apertura: z.string().min(1),
  fecha_renovacion: z.string().nullable().optional(),
  periodo_contrato_meses: z.number().int().nullable().optional(),
  programa_beneficios: z.string().nullable().optional(),
  tipo_beneficio: TipoBeneficio,
  tasa_beneficio: z.string().nullable().optional(),
  activo: z.boolean().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
