import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users } from '@/lib/db/schema';

/**
 * Input Schema for creating/updating users.
 * Built from the DB schema but limited to UI-allowed fields.
 */
export const userSchema = createInsertSchema(users, {
  username: z.string().trim().min(3, 'El usuario debe tener al menos 3 caracteres').max(50, 'Usuario demasiado largo'),
  role: z.enum(['admin', 'vendedor']),
})
  .pick({ username: true, role: true })
  .extend({
    id: z.string().optional(),
    password: z.string().trim().min(6, 'La contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
  });

export type UserInput = z.infer<typeof userSchema>;

/**
 * Definition schema automatically inferred from DB Columns.
 * Used for reading data with full type safety.
 */
export const userDefSchema = createSelectSchema(users)
  .omit({ passwordHash: true })
  .extend({
    // Override or add specific client-side requirements if needed
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
  });

export type UserDef = z.infer<typeof userDefSchema>;
