'use server';

import { z } from 'zod';
import { deviceRepository } from '@/features/device/repository/device.repository';
import { deviceRowSchema, type DeviceDef } from '@/features/device/domain/device.schema';

/**
 * Única Server Action de "device" que el catálogo público (Vercel) necesita.
 * Ver nota en public-product.actions.ts sobre por qué vive separada de device.actions.ts.
 */
export async function fetchLandingCategories(): Promise<DeviceDef[]> {
  try {
    const devicesList = await deviceRepository.getAllDevices();
    // Only return active categories for the landing page
    const active = devicesList.filter((d) => d.isActive);
    return z.array(deviceRowSchema).parse(active);
  } catch (error) {
    console.error('fetchLandingCategories error:', error);
    return [];
  }
}
