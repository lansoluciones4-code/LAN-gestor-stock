import { z } from 'zod';

export const providerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo'),
  phone: z.string().max(30, 'Número de teléfono demasiado largo').optional().or(z.literal('')),
  email: z.string().max(100).optional().or(z.literal('')),
});

export type ProviderInput = z.infer<typeof providerSchema>;
