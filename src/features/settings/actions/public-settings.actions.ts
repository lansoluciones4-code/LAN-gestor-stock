'use server';

import { settingsRepository } from '@/features/settings/repository/settings.repository';

/**
 * Única Server Action de "settings" que el catálogo público (Vercel) necesita.
 * Solo lee — nunca crea la fila (evita escrituras desde el sitio público).
 * Si todavía no se publicó ninguna configuración, muestra precios por defecto.
 */
export async function fetchPublicShowPrices(): Promise<boolean> {
  try {
    const settings = await settingsRepository.get();
    return settings?.showPrices ?? true;
  } catch (error) {
    console.error('fetchPublicShowPrices error:', error);
    return true;
  }
}
