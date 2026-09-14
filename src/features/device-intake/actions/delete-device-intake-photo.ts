'use server';

import { db } from '@/lib/db';
import { deviceIntakePhotos } from '@/lib/db/schema';
import { cloudinaryService } from '@/lib/cloudinary';
import { ActionResult } from '@/lib/action-result';
import { eq } from 'drizzle-orm';
import { ConcurrencyError } from '@/lib/errors';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function deleteDeviceIntakePhoto(publicId: string): Promise<ActionResult> {
  try {
    await verifyAuthOrAdmin(false);

    if (!publicId) {
      return { success: false, error: 'Public ID is required' };
    }

    const image = await db.query.deviceIntakePhotos.findFirst({
      where: eq(deviceIntakePhotos.publicId, publicId),
    });

    if (!image) {
      throw new ConcurrencyError('La imagen ya fue eliminada o no existe.');
    }

    await cloudinaryService.deleteImage(publicId);

    const deleted = await db.delete(deviceIntakePhotos).where(eq(deviceIntakePhotos.publicId, publicId)).returning();

    if (deleted.length === 0) {
      throw new ConcurrencyError('Error de concurrencia al eliminar la imagen.');
    }

    return { success: true, data: undefined };
  } catch (error: any) {
    console.error('Error in deleteDeviceIntakePhoto:', error);
    if (error instanceof ConcurrencyError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'No se pudo eliminar la foto de la recepción' };
  }
}
