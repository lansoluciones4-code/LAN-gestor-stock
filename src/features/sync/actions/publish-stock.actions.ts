'use server';

import { db } from '@/lib/db';
import { getSupabaseDb } from '@/lib/db/supabase-pool';
import { devices, providers, products, productImages, appSettings } from '@/lib/db/schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';
import { auditLogRepository } from '@/features/audit/repository/audit-log.repository';
import { settingsRepository } from '@/features/settings/repository/settings.repository';
import { ActionResult } from '@/lib/action-result';

type PublishSummary = {
  productCount: number;
  deviceCount: number;
  providerCount: number;
  imageCount: number;
};

/**
 * Lee el catálogo completo de la base LOCAL y sobrescribe (DELETE + INSERT en una
 * transacción) las mismas tablas en Supabase, que es lo que ya lee el sitio público
 * de Vercel hoy. No toca users/sales/customers/audit_logs: esas quedan solo locales.
 *
 * `product_views` (contador de "más vistos", Paso 9) tampoco se toca acá — y es a propósito,
 * no un olvido: esa tabla vive solo en Supabase, poblada por las visitas reales del sitio
 * público, y su `product_id` es un uuid suelto sin FK justamente para no depender de este
 * DELETE+INSERT de `products`. Sumarla a este reemplazo le resetearía el contador en cada
 * publicación — no agregarla a las listas de abajo.
 */
export async function publicarStock(): Promise<ActionResult<PublishSummary>> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    const [localDevices, localProviders, localProducts, localImages, localSettings] = await Promise.all([
      db.select().from(devices),
      db.select().from(providers),
      db.select().from(products),
      db.select().from(productImages),
      settingsRepository.getOrCreate(),
    ]);

    const supabaseDb = getSupabaseDb();

    await supabaseDb.transaction(async (tx) => {
      // Orden por FKs: borrar primero lo que depende de otras tablas
      await tx.delete(productImages);
      await tx.delete(products);
      await tx.delete(providers);
      await tx.delete(devices);
      await tx.delete(appSettings);

      if (localDevices.length) await tx.insert(devices).values(localDevices);
      if (localProviders.length) await tx.insert(providers).values(localProviders);
      if (localProducts.length) await tx.insert(products).values(localProducts);
      if (localImages.length) await tx.insert(productImages).values(localImages);
      await tx.insert(appSettings).values(localSettings);
    });

    const summary: PublishSummary = {
      productCount: localProducts.length,
      deviceCount: localDevices.length,
      providerCount: localProviders.length,
      imageCount: localImages.length,
    };

    await recordAuditLog(caller.id, 'PUBLICAR_STOCK', 'SYNC', undefined, summary);

    return {
      success: true,
      data: summary,
      message: `Se publicaron ${summary.productCount} productos al sitio web.`,
    };
  } catch (error) {
    console.error('Error in publicarStock:', error);
    return { success: false, error: 'No se pudo publicar el stock al sitio web. Verificá la conexión con Supabase.' };
  }
}

export type LastSyncInfo = {
  at: Date | string;
  username: string;
  productCount: number | null;
};

export async function getLastSyncInfo(): Promise<LastSyncInfo | null> {
  try {
    const [lastLog] = await auditLogRepository.getLogsByEntity('SYNC');
    if (!lastLog) return null;

    return {
      at: lastLog.createdAt,
      username: lastLog.user?.username ?? 'Desconocido',
      productCount: (lastLog.detail as PublishSummary | null)?.productCount ?? null,
    };
  } catch (error) {
    console.error('getLastSyncInfo error:', error);
    return null;
  }
}
