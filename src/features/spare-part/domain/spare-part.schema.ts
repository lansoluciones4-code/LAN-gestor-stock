import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { spareParts } from '@/lib/db/schema';
import { isValidDecimal } from '@/lib/utils';
import { toNumber } from '@/lib/zod-helpers';

/** Input schema for creating a repuesto/art. usado. */
export const sparePartCreateSchema = createInsertSchema(spareParts, {
  title: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(150, 'Nombre demasiado largo'),
  condition: z.enum(['usado', 'nuevo']),
  // Importante para el seguimiento, pero opcional — puede quedar sin cliente asociado.
  customerId: z.string().uuid('ID de cliente inválido').optional().nullable(),
  cost: toNumber().pipe(
    z
      .number()
      .gt(0, 'El costo debe ser mayor a 0')
      .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
  ),
  profitPercentage: toNumber().pipe(
    z
      .number()
      .min(0, 'El porcentaje no puede ser negativo')
      .max(1000, 'Porcentaje demasiado alto')
      .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
  ),
}).pick({ title: true, condition: true, customerId: true, cost: true, profitPercentage: true });

export type SparePartInput = z.infer<typeof sparePartCreateSchema>;

/** Subset usado por el formulario (react-hook-form): el cliente se resuelve aparte, vía SaleCustomerPicker, no como un input registrado. */
export const sparePartFormSchema = sparePartCreateSchema.omit({ customerId: true });
export type SparePartFormInput = z.infer<typeof sparePartFormSchema>;

/** Input schema for updating a repuesto (parcial + version, bloqueado en el server si ya está vendido). */
export const sparePartUpdateSchema = sparePartCreateSchema.partial().extend({
  version: z.number().int().min(1),
});
export type SparePartUpdateInput = z.infer<typeof sparePartUpdateSchema>;

/** Row schema for reading a repuesto from la DB — agrega los campos calculados de ganancia/precio de venta. */
export const sparePartRowSchema = createSelectSchema(spareParts)
  .extend({
    cost: z.preprocess((val) => parseFloat(val as string), z.number()),
    profitPercentage: z.preprocess((val) => parseFloat(val as string), z.number()),
    version: z.number(),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
    customer: z.object({ id: z.string(), name: z.string() }).nullish(),
    /** true si ya tiene una línea de venta asociada (irreversible: no se puede editar/borrar). */
    sold: z.boolean().default(false),
  })
  .transform((row) => {
    const profitAmount = Math.round(row.cost * (row.profitPercentage / 100) * 100) / 100;
    return {
      ...row,
      profitAmount,
      salePrice: Math.round((row.cost + profitAmount) * 100) / 100,
    };
  });

export type SparePartDef = z.infer<typeof sparePartRowSchema>;
