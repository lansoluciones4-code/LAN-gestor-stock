'use server';

import { settingsRepository } from '@/features/settings/repository/settings.repository';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';
import { ActionResult } from '@/lib/action-result';

export async function fetchShowPrices(): Promise<boolean> {
  try {
    await verifyAuthOrAdmin(false);
    const settings = await settingsRepository.getOrCreate();
    return settings.showPrices;
  } catch (error) {
    console.error('fetchShowPrices error:', error);
    return true;
  }
}

export async function updateShowPricesAction(showPrices: boolean): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    await settingsRepository.setShowPrices(showPrices);
    await recordAuditLog(caller.id, 'ACTUALIZAR', 'SETTINGS', undefined, {
      showPrices,
      note: showPrices ? 'Precios visibles en el catálogo web' : 'Precios ocultos en el catálogo web',
    });
    return {
      success: true,
      message: showPrices ? 'Los precios ahora se muestran en el catálogo web.' : 'Los precios ahora están ocultos en el catálogo web.',
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'No se pudo actualizar la configuración.' };
  }
}
