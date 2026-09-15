import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { expenses } from '@/lib/db/schema';
import { isValidDecimal } from '@/lib/utils';
import { toNumber } from '@/lib/zod-helpers';

/** Subconjunto de `business_section` que aplica a una boleta de gasto — 'impresiones' no aplica (mismo gotcha que devices.section). */
export const expenseSectionEnum = z.enum(['tech', 'libreria']);
export type ExpenseSection = z.infer<typeof expenseSectionEnum>;

/** Input schema for creating an expense (boleta de gasto) — form → server. */
export const expenseCreateSchema = createInsertSchema(expenses, {
  section: expenseSectionEnum,
  providerId: z.string().uuid('Seleccioná un proveedor'),
  pointOfSale: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Solo números')
    .max(20, 'Máximo 20 dígitos'),
  receiptNumber: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Solo números')
    .max(20, 'Máximo 20 dígitos'),
  amount: toNumber().pipe(
    z
      .number()
      .gt(0, 'El importe debe ser mayor a 0')
      .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
  ),
  date: z.string().min(1, 'Seleccioná una fecha'),
}).pick({ section: true, providerId: true, pointOfSale: true, receiptNumber: true, amount: true, date: true });

export type ExpenseInput = z.infer<typeof expenseCreateSchema>;

/** Input schema para editar: se reenvían todos los campos (sin diffing parcial) + version para optimistic locking. */
export const expenseUpdateSchema = expenseCreateSchema.extend({
  version: z.number().int().min(1),
});
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;

/** Row schema for reading an expense from the DB. */
export const expenseRowSchema = createSelectSchema(expenses).extend({
  amount: z.preprocess((val) => parseFloat(val as string), z.number()),
  version: z.number(),
  date: z.union([z.date(), z.string()]),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  provider: z
    .object({ id: z.string(), name: z.string() })
    .optional()
    .nullable(),
});

export type ExpenseDef = z.infer<typeof expenseRowSchema>;
