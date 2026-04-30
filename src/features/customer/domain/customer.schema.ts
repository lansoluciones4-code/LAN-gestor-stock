import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { customers } from '@/lib/db/schema';

/**
 * Input Schema for creating/updating customers.
 */
export const customerSchema = createInsertSchema(customers, {
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo'),
  phone: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio')
    .max(30, 'Número de teléfono demasiado largo')
    .regex(/^[0-9\s+-]*$/, 'Formato de teléfono inválido (solo números, +, - y espacios)'),
  email: z.email('Formato de correo electrónico inválido').trim().min(1, 'El correo electrónico es obligatorio').max(100, 'El correo electrónico es demasiado largo'),
  documentNumber: z.string().trim().min(1, 'El DNI es obligatorio').max(20, 'Documento demasiado largo'),
})
  .pick({ name: true, phone: true, email: true, documentNumber: true })
  .extend({
    id: z.string().optional(),
  });

export type CustomerInput = z.infer<typeof customerSchema>;

export const customerUpdateSchema = customerSchema.partial().extend({
  version: z.number().int().min(1),
});
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

/**
 * Definition schema for reading customers.
 */
export const customerDefSchema = createSelectSchema(customers).extend({
  version: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type CustomerDef = z.infer<typeof customerDefSchema>;
