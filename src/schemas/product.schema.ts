import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { products } from '@/lib/db/schema';

/**
 * Input Schema for creating/updating products.
 */
export const productSchema = createInsertSchema(products, {
  deviceId: z.string().trim().min(1, 'Debes seleccionar un equipo válido'),
  providerId: z.string().trim().min(1, 'Debes seleccionar un proveedor válido'),
  description: z.string().trim().max(255, 'La descripción es demasiado larga').optional(),
  purchasePrice: z.number({ message: 'Precio o unidades válidas' }).min(0, 'El precio de compra no puede ser negativo'),
  salePrice: z.number({ message: 'Precio o unidades válidas' }).min(0, 'El precio de venta no puede ser negativo'),
  stock: z.number({ message: 'Precio o unidades válidas' }).int('El stock debe ser un número entero').min(0, 'El stock no puede ser negativo'),
})
  .pick({ deviceId: true, providerId: true, description: true, purchasePrice: true, salePrice: true, stock: true })
  .extend({
    id: z.string().optional(),
  });

export type ProductInput = z.infer<typeof productSchema>;

/**
 * Definition schema for reading products.
 * Includes nested relations for the UI.
 */
export const productDefSchema = createSelectSchema(products).extend({
  purchasePrice: z.number(),
  salePrice: z.number(),
  device: z.object({ id: z.string(), name: z.string() }).optional().nullable(),
  provider: z.object({ id: z.string(), name: z.string() }).optional().nullable(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type ProductDef = z.infer<typeof productDefSchema>;
