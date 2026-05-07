import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users } from '@/lib/db/schema';

const usernameField = z
  .string()
  .trim()
  .min(3, 'El usuario debe tener al menos 3 caracteres')
  .max(50, 'Usuario demasiado largo');

const roleField = z.enum(['admin', 'vendedor']);


/** Input schema for creating a user (form → server). Password is required. */
export const userCreateSchema = createInsertSchema(users, {
  username: usernameField,
  role: roleField,
})
  .pick({ username: true, role: true })
  .extend({
    password: z.string().trim().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  });

export type UserInput = z.infer<typeof userCreateSchema>;

/** Input schema for updating a user (partial fields + version). Password optional. */
export const userUpdateSchema = userCreateSchema.partial().extend({
  version: z.number().int().min(1),
  password: z
    .string()
    .trim()
    .refine((v) => v === '' || v.length >= 6, 'La contraseña debe tener al menos 6 caracteres')
    .optional(),
});
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

/**
 * Form validation schema shared by create and edit flows.
 * Uses superRefine to apply mode-aware password rules:
 *   - Creating (isEditing=false): password must be ≥6 chars
 *   - Editing  (isEditing=true) : password may be empty (keep existing) or ≥6 chars
 *
 * Strip `isEditing` from the payload before sending to the server action.
 */
export const userFormSchema = z
  .object({
    username: usernameField,
    role: roleField,
    password: z.string().trim(),
    isEditing: z.boolean().optional(),
  })
  .superRefine(({ password, isEditing }, ctx) => {
    const isEmpty = password === '';
    const tooShort = password.length < 6;

    if (!isEditing && tooShort) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    if (isEditing && !isEmpty && tooShort) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }
  });

export type UserFormInput = z.infer<typeof userFormSchema>;

/** Row schema for reading a user from the DB. */
export const userRowSchema = createSelectSchema(users)
  .omit({ passwordHash: true })
  .extend({
    version: z.number(),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
  });

export type UserDef = z.infer<typeof userRowSchema>;


