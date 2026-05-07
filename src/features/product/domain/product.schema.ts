import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { products } from '@/lib/db/schema';
import { isValidDecimal } from '@/lib/utils';
import { toNumber } from '@/lib/zod-helpers';

const priceField = (label: string) =>
  toNumber().pipe(
    z
      .number()
      .gt(0, `${label} debe ser mayor a 0`)
      .refine((v) => isValidDecimal(v, 2), 'Máximo 2 decimales')
  );

/** Input schema for creating a product batch (form → server). */
export const productCreateSchema = createInsertSchema(products)
  .pick({ deviceId: true, providerId: true, description: true, purchasePrice: true, salePrice: true, stock: true })
  .extend({
    deviceId: z.string().trim().min(1, 'Debes seleccionar un equipo válido'),
    providerId: z.string().trim().min(1, 'Debes seleccionar un proveedor válido'),
    description: z.string().trim().max(255, 'La descripción es demasiado larga').optional(),
    purchasePrice: priceField('El precio de compra'),
    salePrice: priceField('El precio de venta'),
    stock: z
       
      .any()
      .transform((v: any, ctx) => {
        const parsed = Number(v);
        if (v === '' || v === null || v === undefined || Number.isNaN(parsed)) {
          ctx.addIssue({ code: 'custom', message: 'Debe ingresar una cantidad válida' });
          return z.NEVER;
        }
        return Math.floor(parsed);
      })
      .pipe(z.number().min(0, 'El stock no puede ser negativo')),
  });

export type ProductInput = z.infer<typeof productCreateSchema>;

/** Input schema for updating a product (partial fields + version). */
export const productUpdateSchema = productCreateSchema.partial().extend({
  version: z.number().int().min(1),
  stockDelta: z.number().int().optional(),
});
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

/** Row schema for reading a product from the DB (with relations). */
export const productRowSchema = createSelectSchema(products).extend({
  purchasePrice: z.preprocess((val) => parseFloat(val as string), z.number()),
  salePrice: z.preprocess((val) => parseFloat(val as string), z.number()),
  showOnLanding: z.boolean(),
  version: z.number(),
  device: z.object({ id: z.string(), name: z.string(), version: z.number() }).optional().nullable(),
  provider: z.object({ id: z.string(), name: z.string(), version: z.number() }).optional().nullable(),
  images: z.array(z.object({ publicId: z.string(), url: z.string() })).optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type ProductDef = z.infer<typeof productRowSchema>;

export type ProductImage = {
  publicId: string;
  url: string;
  createdAt: Date;
};


