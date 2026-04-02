import { desc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { devices } from '@/lib/db/schema';
import type { DeviceInput } from '@/schemas/device.schema';

export class DeviceRepository {
  async getAllDevices() {
    return await db.query.devices.findMany({
      orderBy: [desc(devices.createdAt)],
    });
  }

  async checkHasRelations(id: string, dbtx: any = db) {
    const productsList = await dbtx.query.products.findMany({
      where: (p: any, { eq }: any) => eq(p.deviceId, id),
      limit: 1,
    });
    return productsList.length > 0;
  }

  async updateActiveStatus(id: string, isActive: boolean, dbtx: any = db) {
    const result = await dbtx
      .update(devices)
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

  async createDevice(input: DeviceInput, dbtx: any = db) {
    // Check for existing (case-insensitive)
    const existing = await dbtx.query.devices.findFirst({
      where: ilike(devices.name, input.name),
    });

    if (existing) {
      if (existing.isActive) {
        throw new Error('Ya existe un equipo registrado con ese nombre.');
      }
      // Reactivate
      const result = await dbtx
        .update(devices)
        .set({
          name: input.name, // Update casing
          isActive: true,
          updatedAt: sql`NOW()`,
        })
        .where(eq(devices.id, existing.id))
        .returning();
      return { ...result[0], wasInactive: true };
    }

    const result = await dbtx.insert(devices).values({ name: input.name, isActive: true }).returning();
    return result[0];
  }

  async updateDevice(id: string, input: DeviceInput, dbtx: any = db) {
    // Check duplication ignoring self
    const existing = await dbtx.query.devices.findFirst({
      where: ilike(devices.name, input.name),
    });

    if (existing && existing.id !== id) {
      throw new Error('El nombre de equipo ya está en uso por otro registro.');
    }

    const result = await dbtx
      .update(devices)
      .set({
        name: input.name,
        updatedAt: sql`NOW()`,
      })
      .where(eq(devices.id, id))
      .returning();
    return result[0];
  }

  async deleteDevice(id: string, dbtx: any = db) {
    await dbtx.delete(devices).where(eq(devices.id, id));
  }
}

export const deviceRepository = new DeviceRepository();
