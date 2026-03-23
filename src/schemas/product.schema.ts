import { z } from 'zod';

export const productSchema = z.object({
  id: z.string().optional(),
  deviceId: z.string('Debes seleccionar un equipo válido'),
  providerId: z.string('Debes seleccionar un proveedor válido'),
  description: z.string().max(255, 'La descripción es demasiado larga').optional(),
  purchasePrice: z.number().min(0, 'El precio de compra no puede ser negativo'),
  salePrice: z.number().min(0, 'El precio de venta no puede ser negativo'),
  stock: z.number().int('El stock debe ser un número entero').min(0, 'El stock no puede ser negativo'),
});

export type ProductInput = z.infer<typeof productSchema>;
