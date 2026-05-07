'use server';

import { db } from '@/lib/db';
import { productImages } from '@/lib/db/schema';
import { cloudinaryService } from '@/lib/cloudinary';
import { ActionResult } from '@/lib/action-result';

export async function uploadProductPhoto(
  productId: string,
  base64Image: string
): Promise<ActionResult<{ url: string; publicId: string }>> {
  try {
    if (!productId || !base64Image) {
      return { success: false, error: 'El ID del producto y la imagen son obligatorios' };
    }

    // Upload to cloudinary
    const { url, publicId } = await cloudinaryService.uploadImage(base64Image, productId);

    // Insert into db
    const [inserted] = await db
      .insert(productImages)
      .values({
        productId,
        url,
        publicId,
      })
      .returning();

    return { success: true, data: inserted };
  } catch (error) {
    console.error('Error in uploadProductPhoto:', error);
    return { success: false, error: 'No se pudo subir la foto del producto' };
  }
}
