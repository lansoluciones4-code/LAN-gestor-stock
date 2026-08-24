import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { productReturns } from '@/lib/db/schema';

/** Input schema for registering a product return (form → server). */
export const productReturnCreateSchema = createInsertSchema(productReturns, {
  productId: z.string().uuid('Debe seleccionar un producto'),
  quantity: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
  reason: z.string().trim().min(1, 'Debe especificar un motivo').max(255, 'Motivo demasiado largo'),
  amount: z.number().min(0, 'El monto no puede ser negativo'),
}).pick({ productId: true, quantity: true, reason: true, amount: true });

export type ProductReturnInput = z.infer<typeof productReturnCreateSchema>;

/** Row schema for reading a product return from the DB (with relations). */
export const productReturnRowSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string(),
  quantity: z.number(),
  reason: z.string(),
  amount: z.preprocess((val) => parseFloat(val as string), z.number()),
  createdAt: z.union([z.date(), z.string()]),
  product: z
    .object({
      id: z.string(),
      description: z.string().nullable(),
      device: z.object({ name: z.string() }).optional().nullable(),
    })
    .optional()
    .nullable(),
  user: z.object({ id: z.string(), username: z.string() }).optional().nullable(),
});

export type ProductReturnDef = z.infer<typeof productReturnRowSchema>;
