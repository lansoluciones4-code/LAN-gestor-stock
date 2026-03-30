import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { devices } from '@/lib/db/schema';
import type { DeviceInput } from '@/schemas/device.schema';

export class DeviceRepository {
  async getAllDevices(includeInactive = false, search?: string) {
    console.log(`[DeviceRepository] Consultando equipos (includeInactive=${includeInactive}, search=${search || 'none'})...`);
    return await db.query.devices.findMany({
      where: and(
        includeInactive ? undefined : eq(devices.isActive, true),
        search ? ilike(devices.name, `%${search}%`) : undefined
      ),
      orderBy: [desc(devices.createdAt)],
    });
  }

  async checkHasRelations(id: string) {
    console.log(`[DeviceRepository] Verificando relaciones (FK) para equipo ID: ${id}...`);
    const productsList = await db.query.products.findMany({
      where: (p, { eq }) => eq(p.deviceId, id),
      limit: 1,
    });
    return productsList.length > 0;
  }

  async updateActiveStatus(id: string, isActive: boolean) {
    console.log(`[DeviceRepository] Actualizando status de equipo ID: ${id} a ${isActive}...`);
    const result = await db.update(devices)
      .set({ isActive, updatedAt: sql`NOW()` })
      .where(eq(devices.id, id))
      .returning();
    return result[0];
  }

  async getDeviceById(id: string) {
    console.log(`[DeviceRepository] Consultando equipo por ID: ${id}...`);
    return await db.query.devices.findFirst({
      where: (devices, { eq }) => eq(devices.id, id),
    });
  }

  async createDevice(input: DeviceInput) {
    console.log(`[DeviceRepository] Insertando nuevo equipo en BD: ${input.name}...`);
    const result = await db
      .insert(devices)
      .values({ name: input.name, isActive: true })
      .returning();
    return result[0];
  }

  async updateDevice(id: string, input: DeviceInput) {
    console.log(`[DeviceRepository] Actualizando datos de equipo ID: ${id}...`);
    const result = await db
      .update(devices)
      .set({ 
        name: input.name,
        updatedAt: sql`NOW()`,
      })
      .where(eq(devices.id, id))
      .returning();
    return result[0];
  }

  async deleteDevice(id: string) {
    console.log(`[DeviceRepository] Eliminando equipo ID: ${id} de BD...`);
    await db.delete(devices).where(eq(devices.id, id));
  }
}

export const deviceRepository = new DeviceRepository();
