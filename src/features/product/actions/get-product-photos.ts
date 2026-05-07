'use server';

import { db } from '@/lib/db';
import { productImages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ActionResult } from '@/lib/action-result';
import { ProductImage } from '@/features/product/domain/product.schema';

export async function getProductPhotos(productId: string): Promise<ActionResult<ProductImage[]>> {
  try {
    if (!productId) {
      return { success: false, error: 'El ID del producto es obligatorio' };
    }

    const images = await db.query.productImages.findMany({
      where: eq(productImages.productId, productId),
      orderBy: [desc(productImages.createdAt)],
      columns: {
        publicId: true,
        url: true,
        createdAt: true,
      },
    });

    return { success: true, data: images };
  } catch (error) {
    console.error('Error fetching product photos:', error);
    return { success: false, error: 'No se pudieron cargar las fotos del producto' };
  }
}
