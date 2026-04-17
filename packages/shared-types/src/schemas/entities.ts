import { z } from 'zod';

export const CreateEntitySchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(['banco', 'financiera', 'cooperativa', 'otro']),
  ruc: z.string().optional(),
});

export const UpdateEntitySchema = CreateEntitySchema.partial();

export type CreateEntityInput = z.infer<typeof CreateEntitySchema>;
export type UpdateEntityInput = z.infer<typeof UpdateEntitySchema>;
