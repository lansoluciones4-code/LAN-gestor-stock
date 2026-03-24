import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { devices } from '@/lib/db/schema';
import type { DeviceInput } from '@/schemas/device.schema';

export class DeviceRepository {
  async getAllDevices(includeInactive = false, search?: string) {
    return await db.query.devices.findMany({
      where: and(
        includeInactive ? undefined : eq(devices.isActive, true),
        search ? ilike(devices.name, `%${search}%`) : undefined
      ),
      orderBy: [desc(devices.createdAt)],
    });
  }

  async checkHasRelations(id: string) {
    const productsList = await db.query.products.findMany({
      where: (p, { eq }) => eq(p.deviceId, id),
      limit: 1,
    });
    return productsList.length > 0;
  }

  async updateActiveStatus(id: string, isActive: boolean) {
    const result = await db.update(devices)
      .set({ isActive, updatedAt: sql`NOW()` })
      .where(eq(devices.id, id))
      .returning();
    return result[0];
  }

  async getDeviceById(id: string) {
    return await db.query.devices.findFirst({
      where: (devices, { eq }) => eq(devices.id, id),
    });
  }

  async createDevice(input: DeviceInput) {
    const result = await db
      .insert(devices)
      .values({ name: input.name, isActive: true })
      .returning();
    return result[0];
  }

  async updateDevice(id: string, input: DeviceInput) {
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
    await db.delete(devices).where(eq(devices.id, id));
  }
}

export const deviceRepository = new DeviceRepository();
