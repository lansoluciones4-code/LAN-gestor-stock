import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { providers } from '@/lib/db/schema';

/**
 * Input Schema for creating/updating providers.
 */
export const providerSchema = createInsertSchema(providers, {
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo'),
  phone: z.string().trim().min(1, 'El teléfono es obligatorio').max(30, 'Número de teléfono demasiado largo'),
  email: z
    .string()
    .trim()
    .email('Formato de correo electrónico inválido')
    .min(1, 'El correo es obligatorio')
    .max(100, 'El correo electrónico es demasiado largo'),
})
  .pick({ name: true, phone: true, email: true })
  .extend({
    id: z.string().optional(),
  });

export type ProviderInput = z.infer<typeof providerSchema>;

export const providerUpdateSchema = providerSchema.partial().extend({
  version: z.number().int().min(1),
});
export type ProviderUpdateInput = z.infer<typeof providerUpdateSchema>;

export const providerDefSchema = createSelectSchema(providers).extend({
  version: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type ProviderDef = z.infer<typeof providerDefSchema>;
