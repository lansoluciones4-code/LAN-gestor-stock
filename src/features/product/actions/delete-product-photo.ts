'use server';

import { db } from '@/lib/db';
import { productImages } from '@/lib/db/schema';
import { cloudinaryService } from '@/lib/cloudinary';
import { ActionResult } from '@/lib/action-result';
import { eq } from 'drizzle-orm';
import { ConcurrencyError } from '@/lib/errors';

export async function deleteProductPhoto(publicId: string): Promise<ActionResult> {
  try {
    if (!publicId) {
      return { success: false, error: 'Public ID is required' };
    }

    // Get the image details to find if it exists
    const image = await db.query.productImages.findFirst({
      where: eq(productImages.publicId, publicId),
    });

    if (!image) {
      throw new ConcurrencyError('La imagen ya fue eliminada o no existe.');
    }

    // Delete from cloudinary
    await cloudinaryService.deleteImage(publicId);

    // Delete from db
    const deleted = await db.delete(productImages).where(eq(productImages.publicId, publicId)).returning();
    
    if (deleted.length === 0) {
      throw new ConcurrencyError('Error de concurrencia al eliminar la imagen.');
    }

    return { success: true, data: undefined };
  } catch (error: any) {
    console.error('Error in deleteProductPhoto:', error);
    if (error instanceof ConcurrencyError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'No se pudo eliminar la foto del producto' };
  }
}
