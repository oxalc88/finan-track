import { z } from 'zod';

export const ResolveDiscrepanciaSchema = z.object({
  resolucion: z.string().min(1),
});

export type ResolveDiscrepanciaInput = z.infer<typeof ResolveDiscrepanciaSchema>;
