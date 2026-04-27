import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { products } from '@/lib/db/schema';
import { isValidDecimal } from '@/lib/utils';

/**
 * Input Schema for creating/updating products.
 */
export const productSchema = createInsertSchema(products)
  .pick({ deviceId: true, providerId: true, description: true, purchasePrice: true, salePrice: true, stock: true })
  .extend({
    id: z.string().optional(),
    deviceId: z.string().trim().min(1, 'Debes seleccionar un equipo válido'),
    providerId: z.string().trim().min(1, 'Debes seleccionar un proveedor válido'),
    description: z.string().trim().max(255, 'La descripción es demasiado larga').optional(),
    purchasePrice: z.any().refine(v => v !== '' && v !== '-' && !isNaN(Number(v)), 'Precio inválido').transform(Number).pipe(z.number().min(0, 'El precio de compra no puede ser negativo').refine(v => isValidDecimal(v, 3), 'Máximo 3 decimales')),
    salePrice: z.any().refine(v => v !== '' && v !== '-' && !isNaN(Number(v)), 'Precio inválido').transform(Number).pipe(z.number().min(0, 'El precio de venta no puede ser negativo').refine(v => isValidDecimal(v, 3), 'Máximo 3 decimales')),
    stock: z.any().refine(v => v !== '' && v !== '-' && !isNaN(Number(v)), 'Precio o unidades inválidas').transform(v => Math.floor(Number(v))).pipe(z.number().min(0, 'El stock no puede ser negativo')),
  });

export type ProductInput = z.infer<typeof productSchema>;

export const productUpdateSchema = productSchema.partial().extend({
  version: z.number().int().min(1),
  stockDelta: z.number().int().optional(),
});
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

/**
 * Definition schema for reading products.
 * Includes nested relations for the UI.
 */
export const productDefSchema = createSelectSchema(products).extend({
  purchasePrice: z.number(),
  salePrice: z.number(),
  showOnLanding: z.boolean(),
  version: z.number(),
  device: z.object({ id: z.string(), name: z.string(), version: z.number() }).optional().nullable(),
  provider: z.object({ id: z.string(), name: z.string(), version: z.number() }).optional().nullable(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type ProductDef = z.infer<typeof productDefSchema>;
