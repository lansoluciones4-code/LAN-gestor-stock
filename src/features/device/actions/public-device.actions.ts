'use server';

import { deviceRepository } from '@/features/device/repository/device.repository';

/**
 * Única Server Action de "device" que el catálogo público (Vercel) necesita.
 * Ver nota en public-product.actions.ts sobre por qué vive separada de device.actions.ts.
 */
export type LandingCategory = { id: string; name: string };

export async function fetchLandingCategories(): Promise<LandingCategory[]> {
  try {
    const devicesList = await deviceRepository.getAllDevices();
    // Categorías distintas entre los equipos activos (no un filtro por modelo puntual).
    const categories = new Set<string>();
    devicesList.forEach((d) => {
      if (d.isActive && d.category) categories.add(d.category);
    });
    return Array.from(categories)
      .sort((a, b) => a.localeCompare(b))
      .map((c) => ({ id: c, name: c }));
  } catch (error) {
    console.error('fetchLandingCategories error:', error);
    return [];
  }
}
