import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(50, 'Username is too long'),
  password: z.string().trim().min(1, 'Password is required'),
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
