import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { providers } from '@/lib/db/schema';

/**
 * Input Schema for creating/updating providers.
 */
export const providerSchema = createInsertSchema(providers, {
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo'),
  phone: z.string().min(1, 'El teléfono es obligatorio').max(30, 'Número de teléfono demasiado largo'),
  email: z.string().min(1, 'El correo es obligatorio').max(100),
})
  .pick({ name: true, phone: true, email: true })
  .extend({
    id: z.string().optional(),
  });

export type ProviderInput = z.infer<typeof providerSchema>;

export const providerDefSchema = createSelectSchema(providers).extend({
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type ProviderDef = z.infer<typeof providerDefSchema>;
