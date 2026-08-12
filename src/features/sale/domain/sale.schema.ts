import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { sales, saleItems, salePrintItems } from '@/lib/db/schema';
import { isValidDecimal } from '@/lib/utils';
import { toNumber } from '@/lib/zod-helpers';

const moneyField = toNumber().pipe(
  z
    .number()
    .min(0)
    .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
);

/** Input schema for a single sale line item (form → server). */
export const saleItemInputSchema = createInsertSchema(saleItems, {
  quantity: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
  unitPrice: z
    .number()
    .min(0)
    .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales'),
  unitCost: z
    .number()
    .min(0)
    .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales'),
  subtotal: z
    .number()
    .min(0)
    .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales'),
}).pick({ productId: true, quantity: true, unitPrice: true, unitCost: true, subtotal: true });

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;

/** Input schema for a single payment method entry. */
export const salePaymentInputSchema = z.object({
  type: z.enum(['efectivo', 'transferencia', 'debito', 'credito']),
  amount: moneyField,
  installments: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]).default(1),
});

export type SalePaymentInput = z.infer<typeof salePaymentInputSchema>;

/** Input schema for a single print (Impresiones) line item. */
export const salePrintItemInputSchema = createInsertSchema(salePrintItems, {
  pages: z.number().int().min(1, 'La cantidad de hojas debe ser al menos 1'),
  unitPrice: z
    .number()
    .min(0)
    .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales'),
  subtotal: z
    .number()
    .min(0)
    .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales'),
}).pick({ pages: true, colorMode: true, unitPrice: true, subtotal: true });

export type SalePrintItemInput = z.infer<typeof salePrintItemInputSchema>;

const customerIdField = createInsertSchema(sales).pick({ customerId: true }).shape.customerId;

/** Input schema for creating a sale of stock products (Tech / Librería) (form → server). */
export const saleCreateSchema = createInsertSchema(sales)
  .pick({ customerId: true, total: true, discountAmount: true, discountPercentage: true })
  .extend({
    businessSection: z.enum(['tech', 'libreria']),
    total: toNumber().pipe(
      z
        .number()
        .min(0, 'El total es requerido')
        .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
    ),
    discountAmount: toNumber().pipe(
      z
        .number()
        .min(0)
        .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
    ),
    discountPercentage: toNumber().pipe(
      z
        .number()
        .min(0)
        .max(100)
        .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
    ),
    items: z.array(saleItemInputSchema).min(1, 'La venta debe tener al menos un producto'),
    payments: z
      .array(salePaymentInputSchema)
      .min(1, 'Debe especificar al menos un método de pago')
      .max(2, 'Solo se permiten hasta dos métodos de pago'),
  });

export type SaleInput = z.infer<typeof saleCreateSchema>;

/** Input schema for creating an Impresiones sale (form → server). No stock/product involved. */
export const printSaleCreateSchema = z.object({
  customerId: customerIdField.optional(),
  total: toNumber().pipe(
    z
      .number()
      .min(0, 'El total es requerido')
      .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
  ),
  discountAmount: toNumber().pipe(
    z
      .number()
      .min(0)
      .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
  ),
  discountPercentage: toNumber().pipe(
    z
      .number()
      .min(0)
      .max(100)
      .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
  ),
  items: z.array(salePrintItemInputSchema).min(1, 'La venta debe tener al menos una impresión cargada'),
  payments: z
    .array(salePaymentInputSchema)
    .min(1, 'Debe especificar al menos un método de pago')
    .max(2, 'Solo se permiten hasta dos métodos de pago'),
});

export type PrintSaleInput = z.infer<typeof printSaleCreateSchema>;

/** Row schema for reading a sale from the DB (with relations). */
export const saleRowSchema = createSelectSchema(sales).extend({
  businessSection: z.enum(['tech', 'impresiones', 'libreria']),
  total: z.preprocess((val) => parseFloat(val as string), z.number()),
  discountAmount: z.preprocess((val) => parseFloat((val as string) || '0'), z.number()),
  discountPercentage: z.preprocess((val) => parseFloat((val as string) || '0'), z.number()),
  createdAt: z.union([z.date(), z.string()]),
  customer: z.object({ id: z.string(), name: z.string() }).optional().nullable(),
  vendor: z.object({ id: z.string(), username: z.string() }).optional().nullable(),
  items: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number(),
        unitPrice: z.preprocess((val) => parseFloat(val as string), z.number()),
        unitCost: z.preprocess((val) => parseFloat(val as string), z.number()),
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
  printItems: z
    .array(
      z.object({
        id: z.string(),
        pages: z.number(),
        colorMode: z.string(),
        unitPrice: z.preprocess((val) => parseFloat(val as string), z.number()),
        subtotal: z.preprocess((val) => parseFloat(val as string), z.number()),
      })
    )
    .optional(),
  payments: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        amount: z.preprocess((val) => parseFloat(val as string), z.number()),
        installments: z.number(),
      })
    )
    .optional(),
});

export type SaleDef = z.infer<typeof saleRowSchema>;


