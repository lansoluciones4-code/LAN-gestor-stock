import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { counters } from '@/lib/db/schema';
import { toNumber } from '@/lib/zod-helpers';

/** Input schema for creating a counter ("anotador"): solo título + cantidad. */
export const counterCreateSchema = createInsertSchema(counters, {
  title: z.string().trim().min(1, 'El título es obligatorio').max(150, 'Título demasiado largo'),
  quantity: toNumber().pipe(z.number().int('La cantidad debe ser un número entero').min(0, 'La cantidad no puede ser negativa')),
}).pick({ title: true, quantity: true });

export type CounterInput = z.infer<typeof counterCreateSchema>;

/** Input schema for updating a counter (título y/o cantidad, admin reescribe libremente). */
export const counterUpdateSchema = counterCreateSchema.partial().extend({
  version: z.number().int().min(1),
});
export type CounterUpdateInput = z.infer<typeof counterUpdateSchema>;

/** Input schema for the vendedor's "restar cantidad" flow. */
export const counterDecrementSchema = z.object({
  id: z.string().uuid(),
  amount: toNumber().pipe(z.number().int('La cantidad debe ser un número entero').positive('Ingresá una cantidad mayor a 0')),
});
export type CounterDecrementInput = z.infer<typeof counterDecrementSchema>;

/** Row schema for reading a counter from the DB. */
export const counterRowSchema = createSelectSchema(counters).extend({
  version: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type CounterDef = z.infer<typeof counterRowSchema>;
