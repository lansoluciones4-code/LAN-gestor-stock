'use server';

import { deviceRepository } from '@/features/device/repository/device.repository';

/**
 * Única Server Action de "device" que el catálogo público (Vercel) necesita.
 * Ver nota en public-product.actions.ts sobre por qué vive separada de device.actions.ts.
 */
export type LandingSection = 'tech' | 'libreria';
export type LandingCategory = { id: string; name: string; section: LandingSection };

export async function fetchLandingCategories(): Promise<LandingCategory[]> {
  try {
    const devicesList = await deviceRepository.getAllDevices();
    // Categorías distintas entre los equipos activos, agrupadas por sección
    // (Tecnología / Librería) para que el catálogo público pueda separarlas.
    const categories = new Map<string, LandingCategory>();
    devicesList.forEach((d) => {
      if (d.isActive && d.category && (d.section === 'tech' || d.section === 'libreria')) {
        const key = `${d.section}::${d.category}`;
        if (!categories.has(key)) categories.set(key, { id: d.category, name: d.category, section: d.section });
      }
    });
    return Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('fetchLandingCategories error:', error);
    return [];
  }
}
