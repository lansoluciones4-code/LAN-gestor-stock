import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { cards } from '@/lib/db/schema';
import { isValidDecimal } from '@/lib/utils';
import { toNumber } from '@/lib/zod-helpers';

/** Una cuota habilitada para una tarjeta y su recargo (%) sobre el precio de venta. */
export const cardInstallmentInputSchema = z.object({
  installments: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]),
  interestPercentage: toNumber().pipe(
    z
      .number()
      .min(0, 'El porcentaje no puede ser negativo')
      .max(1000, 'Porcentaje demasiado alto')
      .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
  ),
});

export type CardInstallmentInput = z.infer<typeof cardInstallmentInputSchema>;

/** Input schema for creating a card (form → server). */
export const cardCreateSchema = createInsertSchema(cards, {
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo'),
})
  .pick({ name: true })
  .extend({
    installments: z
      .array(cardInstallmentInputSchema)
      .min(1, 'Debe habilitar al menos una cantidad de cuotas')
      .refine((items) => new Set(items.map((i) => i.installments)).size === items.length, 'No se puede repetir la misma cantidad de cuotas'),
  });

export type CardInput = z.infer<typeof cardCreateSchema>;

/** Input schema for updating a card (partial fields + version). */
export const cardUpdateSchema = cardCreateSchema.partial().extend({
  version: z.number().int().min(1),
});
export type CardUpdateInput = z.infer<typeof cardUpdateSchema>;

/** Row schema for reading a card from the DB (con sus cuotas habilitadas). */
export const cardRowSchema = createSelectSchema(cards).extend({
  version: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  installments: z
    .array(
      z.object({
        id: z.string(),
        installments: z.number(),
        interestPercentage: z.preprocess((val) => parseFloat(val as string), z.number()),
      })
    )
    .default([]),
});

export type CardDef = z.infer<typeof cardRowSchema>;
