import { z } from 'zod';

export const CreateCategorySchema = z.object({
  nombre: z.string().min(1),
  es_deducible_sunat: z.boolean().default(false),
  color: z.string().optional(),
});

export const MergeCategoriesSchema = z.object({
  source_id: z.string().min(1),
  target_id: z.string().min(1),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type MergeCategoriesInput = z.infer<typeof MergeCategoriesSchema>;
