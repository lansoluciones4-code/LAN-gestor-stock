'use server';

import { db } from '@/lib/db';
import { deviceIntakePhotos } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ActionResult } from '@/lib/action-result';
import { type DeviceIntakePhoto } from '@/features/device-intake/domain/device-intake-photo.types';

export async function getDeviceIntakePhotos(deviceIntakeId: string): Promise<ActionResult<DeviceIntakePhoto[]>> {
  try {
    if (!deviceIntakeId) {
      return { success: false, error: 'El ID de la recepción es obligatorio' };
    }

    const images = await db.query.deviceIntakePhotos.findMany({
      where: eq(deviceIntakePhotos.deviceIntakeId, deviceIntakeId),
      orderBy: [desc(deviceIntakePhotos.createdAt)],
      columns: {
        publicId: true,
        url: true,
        createdAt: true,
      },
    });

    return { success: true, data: images };
  } catch (error) {
    console.error('Error fetching device intake photos:', error);
    return { success: false, error: 'No se pudieron cargar las fotos de la recepción' };
  }
}
