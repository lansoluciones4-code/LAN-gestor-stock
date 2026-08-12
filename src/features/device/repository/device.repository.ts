import { desc, eq, ilike, sql, and, isNotNull, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { devices, products } from '@/lib/db/schema';
import type { DeviceInput, DeviceUpdateInput } from '@/features/device/domain/device.schema';
import { ConcurrencyError, DuplicateEntityError } from '@/lib/errors';

type DeviceTextField = 'category' | 'brand';

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
            category: input.category,
            brand: input.brand || null,
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
        category: input.category,
        brand: input.brand || null,
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
    if (input.category !== undefined) updateData.category = input.category;
    if (input.brand !== undefined) updateData.brand = input.brand || null;

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

  /**
   * Distinct values already used for `category`/`brand`, with a flag indicating whether
   * any product currently depends on a device carrying that value (used to gate deletion).
   */
  async getFieldOptions(field: DeviceTextField) {
    const column = devices[field];
    const rows = await db
      .select({ value: column, productCount: sql<number>`count(${products.id})`.mapWith(Number) })
      .from(devices)
      .leftJoin(products, eq(products.deviceId, devices.id))
      .where(and(isNotNull(column), ne(column, '')))
      .groupBy(column);

    return rows.map((r) => ({ value: r.value as string, hasProducts: r.productCount > 0 }));
  }

  /** Clears `field` on every device using `value`, only if none of them has products yet. */
  async clearFieldOption(field: DeviceTextField, value: string) {
    const column = devices[field];
    const inUse = await db
      .select({ id: products.id })
      .from(products)
      .innerJoin(devices, eq(products.deviceId, devices.id))
      .where(eq(column, value))
      .limit(1);

    if (inUse.length > 0) {
      throw new Error('No se puede eliminar: hay productos que dependen de ese valor.');
    }

    await db.update(devices).set({ [field]: null }).where(eq(column, value));
  }
}

export const deviceRepository = new DeviceRepository();
