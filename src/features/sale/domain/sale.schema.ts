import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { sales, saleItems, salePrintItems, saleServiceItems } from '@/lib/db/schema';
import { isValidDecimal } from '@/lib/utils';
import { toNumber } from '@/lib/zod-helpers';

const moneyField = toNumber().pipe(
  z
    .number()
    .min(0)
    .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
);

const discountPercentageField = z
  .number()
  .min(0)
  .max(100)
  .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
  .optional()
  .default(0);

/** Input schema for a single sale line item — producto (Tech / Librería) (form → server). */
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
})
  .pick({ productId: true, quantity: true, unitPrice: true, unitCost: true, subtotal: true })
  .extend({
    /** Descuento sobre este producto en particular (0-100). El servidor lo aplica sobre el precio real del producto, nunca sobre el unitPrice que mande el cliente. */
    discountPercentage: discountPercentageField,
  });

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;

/** Input schema for a single payment method entry. */
export const salePaymentInputSchema = z.object({
  type: z.enum(['efectivo', 'transferencia', 'debito', 'credito']),
  amount: moneyField,
  installments: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]).default(1),
  /** Tarjeta usada para un pago en Crédito (referencia informativa; el servidor no recalcula el recargo). */
  cardId: z.string().uuid().nullable().optional(),
});

export type SalePaymentInput = z.infer<typeof salePaymentInputSchema>;

/** Input schema for a single print (Impresiones) line item. Solo modo + importe total, sin catálogo de precio: el importe ya viene cargado (y descontado) por el cliente. */
export const salePrintItemInputSchema = createInsertSchema(salePrintItems, {
  subtotal: z
    .number()
    .gt(0, 'El importe debe ser mayor a 0')
    .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales'),
}).pick({ colorMode: true, kind: true, title: true, subtotal: true });

export type SalePrintItemInput = z.infer<typeof salePrintItemInputSchema>;

/** Input schema for a single technical-service line item (form → server). */
export const saleServiceItemInputSchema = createInsertSchema(saleServiceItems, {
  quantity: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
  unitValue: z
    .number()
    .min(0)
    .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales'),
  subtotal: z
    .number()
    .min(0)
    .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales'),
})
  .pick({ technicalServiceId: true, quantity: true, unitValue: true, subtotal: true })
  .extend({
    /** Descuento sobre este servicio en particular (0-100). El servidor lo aplica sobre el valor real del servicio, nunca sobre el unitValue que mande el cliente. */
    discountPercentage: discountPercentageField,
  });

export type SaleServiceItemInput = z.infer<typeof saleServiceItemInputSchema>;

/** Input schema for creating a sale (form → server). Puede combinar productos, impresiones y servicios técnicos en un mismo registro. */
export const saleCreateSchema = createInsertSchema(sales)
  .pick({ customerId: true, total: true, discountAmount: true, discountPercentage: true })
  .extend({
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
    items: z.array(saleItemInputSchema).default([]),
    printItems: z.array(salePrintItemInputSchema).default([]),
    serviceItems: z.array(saleServiceItemInputSchema).default([]),
    payments: z
      .array(salePaymentInputSchema)
      .min(1, 'Debe especificar al menos un método de pago')
      .max(1, 'Solo se permite un método de pago'),
  })
  .refine((data) => data.items.length + data.printItems.length + data.serviceItems.length > 0, {
    message: 'La venta debe tener al menos un producto, impresión o servicio técnico',
    path: ['items'],
  });

export type SaleInput = z.infer<typeof saleCreateSchema>;

/** Row schema for reading a sale from the DB (with relations). */
export const saleRowSchema = createSelectSchema(sales).extend({
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
        colorMode: z.string().nullable(),
        kind: z.string(),
        title: z.string().nullable().optional(),
        subtotal: z.preprocess((val) => parseFloat(val as string), z.number()),
      })
    )
    .optional(),
  serviceItems: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number(),
        unitValue: z.preprocess((val) => parseFloat(val as string), z.number()),
        subtotal: z.preprocess((val) => parseFloat(val as string), z.number()),
        technicalService: z
          .object({
            id: z.string(),
            name: z.string(),
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
        installments: z.number(),
        card: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .optional()
          .nullable(),
      })
    )
    .optional(),
});

export type SaleDef = z.infer<typeof saleRowSchema>;
