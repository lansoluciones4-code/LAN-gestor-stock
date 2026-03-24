import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { customers } from '@/lib/db/schema';

/**
 * Input Schema for creating/updating customers.
 */
export const customerSchema = createInsertSchema(customers, {
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo'),
  phone: z.string().max(30, 'Número de teléfono demasiado largo').optional().or(z.literal('')),
  email: z.string().max(100).optional().or(z.literal('')),
  documentNumber: z.string().max(20, 'Documento demasiado largo').optional().or(z.literal('')),
})
  .pick({ name: true, phone: true, email: true, documentNumber: true })
  .extend({
    id: z.string().optional(),
  });

export type CustomerInput = z.infer<typeof customerSchema>;

/**
 * Definition schema for reading customers.
 */
export const customerDefSchema = createSelectSchema(customers).extend({
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type CustomerDef = z.infer<typeof customerDefSchema>;
