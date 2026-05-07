import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'El nombre de usuario es obligatorio').max(50, 'El nombre de usuario es demasiado largo'),
  password: z.string().trim().min(1, 'La contraseña es obligatoria'),
});

export const userSessionSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.enum(['admin', 'vendedor']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserSessionPayload = z.infer<typeof userSessionSchema>;
export type UserSession = z.infer<typeof userSessionSchema>;
export type Role = z.infer<typeof userSessionSchema>['role'];
