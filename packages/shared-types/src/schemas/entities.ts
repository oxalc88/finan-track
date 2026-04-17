import { z } from 'zod';

const TipoEntidad = z.enum(['BANCO', 'FINTECH', 'FINANCIERA']);

export const CreateEntitySchema = z.object({
  nombre: z.string().min(1),
  tipo: TipoEntidad,
  clave_descifrado: z.string(),
  patron_clave: z.string(),
});

export const UpdateEntitySchema = CreateEntitySchema.partial();

export type CreateEntityInput = z.infer<typeof CreateEntitySchema>;
export type UpdateEntityInput = z.infer<typeof UpdateEntitySchema>;
