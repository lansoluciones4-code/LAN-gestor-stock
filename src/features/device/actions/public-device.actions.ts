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
    // Categorías distintas entre los equipos activos, sin importar la sección
    // (Tecnología / Librería) — el catálogo público las muestra todas juntas.
    const categories = new Map<string, LandingCategory>();
    devicesList.forEach((d) => {
      if (d.isActive && d.category && (d.section === 'tech' || d.section === 'libreria')) {
        if (!categories.has(d.category)) categories.set(d.category, { id: d.category, name: d.category });
      }
    });
    return Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('fetchLandingCategories error:', error);
    return [];
  }
}
