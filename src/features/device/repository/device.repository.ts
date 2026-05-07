import { desc, eq, ilike, sql, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { devices } from '@/lib/db/schema';
import type { DeviceInput, DeviceUpdateInput } from '@/features/device/domain/device.schema';
import { ConcurrencyError, DuplicateEntityError } from '@/lib/errors';

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
      .set({
        isActive,
        updatedAt: sql`NOW()`,
        version: sql`${devices.version} + 1`,
      })
      .where(eq(devices.id, id))
      .returning();
    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }

  async getDeviceById(id: string) {
    return await db.query.devices.findFirst({
      where: (devices, { eq }) => eq(devices.id, id),
    });
  }

  async createDevice(input: DeviceInput, dbtx: any = db) {
    // Check for existing (for reactivation logic)
    const existing = await dbtx.query.devices.findFirst({
      where: ilike(devices.name, input.name),
    });

    if (existing) {
      if (!existing.isActive) {
        // Reactivate
        const result = await dbtx
          .update(devices)
          .set({
            name: input.name,
            isActive: true,
            updatedAt: sql`NOW()`,
            version: sql`${devices.version} + 1`,
          })
          .where(eq(devices.id, existing.id))
          .returning();
        return { ...result[0], wasInactive: true };
      } else {
        throw new DuplicateEntityError();
      }
    }

    const result = await dbtx
      .insert(devices)
      .values({
        name: input.name,
        isActive: true,
        version: 1,
      })
      .returning();
    return result[0];
  }

  async updateDevice(id: string, input: DeviceUpdateInput, dbtx: any = db) {
    const updateData: any = {
      updatedAt: sql`NOW()`,
      version: sql`${devices.version} + 1`,
    };
    if (input.name !== undefined) {
      const existing = await dbtx.query.devices.findFirst({
        where: and(ilike(devices.name, input.name), sql`${devices.id} != ${id}`),
      });
      if (existing) throw new DuplicateEntityError();
      updateData.name = input.name;
    }

    const result = await dbtx
      .update(devices)
      .set(updateData)
      .where(and(eq(devices.id, id), eq(devices.version, input.version)))
      .returning();

    if (result.length === 0) {
      throw new ConcurrencyError();
    }
    return result[0];
  }

  async deleteDevice(id: string, dbtx: any = db) {
    const result = await dbtx.delete(devices).where(eq(devices.id, id)).returning();
    if (result.length === 0) throw new ConcurrencyError();
  }
}

export const deviceRepository = new DeviceRepository();
