import { z } from 'zod';

export const IngestRequestSchema = z.object({
  canal: z.enum(['telegram', 'email', 'drive', 'manual']),
  entidad_id: z.string().min(1),
  producto_id: z.string().min(1),
  password: z.string().optional(),
});

export type IngestRequest = z.infer<typeof IngestRequestSchema>;
