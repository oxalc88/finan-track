import { z } from 'zod';

const OrigenCategoriaCreacion = z.enum(['LLM_SUGERIDA', 'USUARIO_CREADA']);

export const CreateCategorySchema = z.object({
  nombre: z.string().min(1),
  es_deducible_sunat: z.boolean().optional().default(false),
  categoria_sunat: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  activa: z.boolean().optional(),
  origen: OrigenCategoriaCreacion.optional().default('USUARIO_CREADA'),
});

export const UpdateCategorySchema = z.object({
  nombre: z.string().min(1).optional(),
  es_deducible_sunat: z.boolean().optional(),
  categoria_sunat: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  activa: z.boolean().optional(),
  mergeada_en_id: z.string().nullable().optional(),
});

export const MergeCategoriesSchema = z.object({
  source_id: z.string().min(1),
  target_id: z.string().min(1),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type MergeCategoriesInput = z.infer<typeof MergeCategoriesSchema>;
