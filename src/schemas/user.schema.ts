import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(50, 'Usuario demasiado largo'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
  role: z.enum(['admin', 'vendedor']),
});

export type UserInput = z.infer<typeof userSchema>;
