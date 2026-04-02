import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { sales, saleItems } from '@/lib/db/schema';

/**
 * Sale Item Schema
 */
export const saleItemSchema = createInsertSchema(saleItems, {
  quantity: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
  unitPrice: z.number().min(0),
  subtotal: z.number().min(0),
}).pick({ productId: true, quantity: true, unitPrice: true, subtotal: true });

export type SaleItemInput = z.infer<typeof saleItemSchema>;

/**
 * Sale Payment Schema
 */
export const salePaymentSchema = z.object({
  type: z.enum(['efectivo', 'transferencia']),
  amount: z.any().refine(v => v !== '' && v !== '-' && !isNaN(Number(v)), 'Monto válido').transform(Number).pipe(z.number().min(0, 'El monto no puede ser negativo')),
});

export type SalePaymentInput = z.infer<typeof salePaymentSchema>;

/**
 * Sale Input Schema
 */
export const saleSchema = createInsertSchema(sales, {
  total: z.preprocess((v) => (typeof v === 'number' ? v.toString() : v), z.string().trim().min(1, 'El total es requerido')),
})
  .pick({ customerId: true, total: true })
  .extend({
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().min(1),
          unitPrice: z.preprocess((v) => (typeof v === 'number' ? v.toString() : v), z.string().trim().min(1, 'El precio es requerido')),
          subtotal: z.preprocess((v) => (typeof v === 'number' ? v.toString() : v), z.string().trim().min(1, 'El subtotal es requerido')),
        })
      )
      .min(1, 'La venta debe tener al menos un producto'),
    payments: z
      .array(salePaymentSchema)
      .min(1, 'Debe especificar al menos un método de pago')
      .max(2, 'Solo se permiten hasta dos métodos de pago'),
  });

export type SaleInput = z.infer<typeof saleSchema>;

/**
 * Sale Definition for UI
 */
export const saleDefSchema = createSelectSchema(sales).extend({
  total: z.preprocess((val) => parseFloat(val as string), z.number()),
  createdAt: z.union([z.date(), z.string()]),
  customer: z.object({ id: z.string(), name: z.string() }).optional().nullable(),
  vendor: z.object({ id: z.string(), username: z.string() }).optional().nullable(),
  items: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number(),
        unitPrice: z.preprocess((val) => parseFloat(val as string), z.number()),
        subtotal: z.preprocess((val) => parseFloat(val as string), z.number()),
        product: z
          .object({
            id: z.string(),
            description: z.string().nullable(),
            device: z.object({ name: z.string() }).optional().nullable(),
          })
          .optional()
          .nullable(),
      })
    )
    .optional(),
  payments: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        amount: z.preprocess((val) => parseFloat(val as string), z.number()),
      })
    )
    .optional(),
});

export type SaleDef = z.infer<typeof saleDefSchema>;
