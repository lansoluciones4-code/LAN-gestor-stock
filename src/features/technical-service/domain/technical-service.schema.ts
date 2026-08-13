import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { technicalServices } from '@/lib/db/schema';
import { isValidDecimal } from '@/lib/utils';
import { toNumber } from '@/lib/zod-helpers';

/** Input schema for creating a technical service (form → server). */
export const technicalServiceCreateSchema = createInsertSchema(technicalServices, {
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(150, 'Nombre demasiado largo'),
  description: z.string().trim().max(500, 'La descripción es demasiado larga').optional(),
  value: toNumber().pipe(
    z
      .number()
      .gt(0, 'El valor debe ser mayor a 0')
      .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
  ),
}).pick({ name: true, description: true, value: true });

export type TechnicalServiceInput = z.infer<typeof technicalServiceCreateSchema>;

/** Input schema for updating a technical service (partial fields + version). */
export const technicalServiceUpdateSchema = technicalServiceCreateSchema.partial().extend({
  version: z.number().int().min(1),
});
export type TechnicalServiceUpdateInput = z.infer<typeof technicalServiceUpdateSchema>;

/** Row schema for reading a technical service from the DB. */
export const technicalServiceRowSchema = createSelectSchema(technicalServices).extend({
  value: z.preprocess((val) => parseFloat(val as string), z.number()),
  version: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type TechnicalServiceDef = z.infer<typeof technicalServiceRowSchema>;
