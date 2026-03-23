import { desc, eq, ilike } from 'drizzle-orm';
import { db } from '@/lib/db';
import { devices } from '@/lib/db/schema';
import type { DeviceInput } from '@/schemas/device.schema';

export class DeviceRepository {
  async getAllDevices(search?: string) {
    if (search) {
      return await db.query.devices.findMany({
        where: (devices, { ilike }) => ilike(devices.name, `%${search}%`),
        orderBy: [desc(devices.createdAt)],
      });
    }
    return await db.query.devices.findMany({
      orderBy: [desc(devices.createdAt)],
    });
  }

  async getDeviceById(id: string) {
    return await db.query.devices.findFirst({
      where: (devices, { eq }) => eq(devices.id, id),
    });
  }

  async createDevice(input: DeviceInput) {
    const result = await db
      .insert(devices)
      .values({ name: input.name })
      .returning();
    return result[0];
  }

  async updateDevice(id: string, input: DeviceInput) {
    const result = await db
      .update(devices)
      .set({ name: input.name })
      .where(eq(devices.id, id))
      .returning();
    return result[0];
  }

  async deleteDevice(id: string) {
    await db.delete(devices).where(eq(devices.id, id));
  }
}

export const deviceRepository = new DeviceRepository();
