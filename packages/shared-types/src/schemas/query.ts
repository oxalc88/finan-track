import { z } from 'zod';

export const QueryRequestSchema = z.object({
  question: z.string().min(1).max(500),
});

export type QueryRequest = z.infer<typeof QueryRequestSchema>;
