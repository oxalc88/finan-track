import { z } from 'zod';

const TipoCuenta = z.enum(['AHORRO', 'PLAZO_FIJO', 'CTS', 'CORRIENTE']);
const Moneda = z.enum(['PEN', 'USD']);

export const CreateAccountSchema = z.object({
  entidad_financiera_id: z.string().min(1),
  tipo: TipoCuenta,
  moneda: Moneda,
  proposito: z.string().nullable().optional(),
  saldo: z.number().int().optional(),
  tasa_interes: z.number().nullable().optional(),
  saldo_actualizado_en: z.string().nullable().optional(),
});

export const UpdateAccountSchema = CreateAccountSchema.partial();

export const UpdateBalanceSchema = z.object({
  saldo: z.number().int(),
});

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
export type UpdateBalanceInput = z.infer<typeof UpdateBalanceSchema>;
