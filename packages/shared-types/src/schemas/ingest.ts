import { z } from 'zod';

export const IngestRequestSchema = z.object({
  canal: z.enum(['TELEGRAM', 'EMAIL', 'DRIVE']),
  entidad_financiera_id: z.string().min(1).optional(),
  producto_credito_id: z.string().min(1).optional(),
  password: z.string().optional(),
});

export type IngestRequestInput = z.infer<typeof IngestRequestSchema>;
