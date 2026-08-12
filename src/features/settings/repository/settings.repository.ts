import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { appSettings } from '@/lib/db/schema';

export class SettingsRepository {
  /** Solo lectura — no crea la fila si no existe (usado por el catálogo público). */
  async get() {
    const [row] = await db.select().from(appSettings).limit(1);
    return row ?? null;
  }

  /** Lectura para el panel de administración: crea la fila por defecto si todavía no existe. */
  async getOrCreate() {
    const existing = await this.get();
    if (existing) return existing;
    const [created] = await db.insert(appSettings).values({}).returning();
    return created;
  }

  async setShowPrices(showPrices: boolean) {
    const current = await this.getOrCreate();
    const [updated] = await db
      .update(appSettings)
      .set({ showPrices, updatedAt: sql`NOW()` })
      .where(eq(appSettings.id, current.id))
      .returning();
    return updated;
  }
}

export const settingsRepository = new SettingsRepository();
