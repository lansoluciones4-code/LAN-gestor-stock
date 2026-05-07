import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { customers } from '@/lib/db/schema';

/** Input schema for creating a customer (form → server). */
export const customerCreateSchema = createInsertSchema(customers, {
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo'),
  phone: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio')
    .max(30, 'Número de teléfono demasiado largo')
    .regex(/^[0-9\s+-]*$/, 'Formato de teléfono inválido (solo números, +, - y espacios)'),
  email: z.email('Formato de correo electrónico inválido').trim().min(1, 'El correo electrónico es obligatorio').max(100, 'El correo electrónico es demasiado largo'),
  documentNumber: z.string().trim().min(1, 'El DNI es obligatorio').max(20, 'Documento demasiado largo'),
}).pick({ name: true, phone: true, email: true, documentNumber: true });

export type CustomerInput = z.infer<typeof customerCreateSchema>;

/** Input schema for updating a customer (partial fields + version). */
export const customerUpdateSchema = customerCreateSchema.partial().extend({
  version: z.number().int().min(1),
});
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

/** Row schema for reading a customer from the DB. */
export const customerRowSchema = createSelectSchema(customers).extend({
  version: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type CustomerDef = z.infer<typeof customerRowSchema>;


