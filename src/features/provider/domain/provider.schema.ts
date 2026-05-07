import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { providers } from '@/lib/db/schema';

/** Input schema for creating a provider (form → server). */
export const providerCreateSchema = createInsertSchema(providers, {
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo'),
  phone: z.string().trim().min(1, 'El teléfono es obligatorio').max(30, 'Número de teléfono demasiado largo'),
  email: z.email('Formato de correo electrónico inválido').trim().min(1, 'El correo es obligatorio').max(100, 'El correo electrónico es demasiado largo'),
}).pick({ name: true, phone: true, email: true });

export type ProviderInput = z.infer<typeof providerCreateSchema>;

/** Input schema for updating a provider (partial fields + version). */
export const providerUpdateSchema = providerCreateSchema.partial().extend({
  version: z.number().int().min(1),
});
export type ProviderUpdateInput = z.infer<typeof providerUpdateSchema>;

/** Row schema for reading a provider from the DB. */
export const providerRowSchema = createSelectSchema(providers).extend({
  version: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type ProviderDef = z.infer<typeof providerRowSchema>;
