import { asc, eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { spareParts, saleSparePartItems, customers } from '@/lib/db/schema';
import type { SparePartInput, SparePartUpdateInput } from '@/features/spare-part/domain/spare-part.schema';
import { ConcurrencyError } from '@/lib/errors';

export class SparePartRepository {
  /** Todos los repuestos (para el panel de gestión), con su cliente y si ya está vendido. */
  async getAllSpareParts(dbtx: any = db) {
    const rows = await dbtx
      .select({
        id: spareParts.id,
        title: spareParts.title,
        condition: spareParts.condition,
        customerId: spareParts.customerId,
        cost: spareParts.cost,
        profitPercentage: spareParts.profitPercentage,
        version: spareParts.version,
        createdAt: spareParts.createdAt,
        updatedAt: spareParts.updatedAt,
        customerName: customers.name,
        soldItemId: saleSparePartItems.id,
      })
      .from(spareParts)
      .leftJoin(customers, eq(spareParts.customerId, customers.id))
      .leftJoin(saleSparePartItems, eq(saleSparePartItems.sparePartId, spareParts.id))
      .orderBy(asc(spareParts.createdAt));

    return rows.map((r: any) => ({
      ...r,
      customer: r.customerId ? { id: r.customerId, name: r.customerName } : null,
      sold: !!r.soldItemId,
    }));
  }

  /** Repuestos aún no vendidos — shape liviano para la tarjeta de doble click en Ventas. */
  async getPendingSparePartsForSale(dbtx: any = db) {
    const rows = await dbtx
      .select({
        id: spareParts.id,
        title: spareParts.title,
        condition: spareParts.condition,
        cost: spareParts.cost,
        profitPercentage: spareParts.profitPercentage,
        customerName: customers.name,
      })
      .from(spareParts)
      .leftJoin(customers, eq(spareParts.customerId, customers.id))
      .leftJoin(saleSparePartItems, eq(saleSparePartItems.sparePartId, spareParts.id))
      .where(isNull(saleSparePartItems.id))
      .orderBy(asc(spareParts.createdAt));

    return rows;
  }

  async isSold(id: string, dbtx: any = db) {
    const existing = await dbtx.query.saleSparePartItems.findFirst({ where: (s: any, { eq }: any) => eq(s.sparePartId, id) });
    return !!existing;
  }

  async createSparePart(input: SparePartInput, dbtx: any = db) {
    const result = await dbtx
      .insert(spareParts)
      .values({
        title: input.title,
        condition: input.condition,
        customerId: input.customerId,
        cost: input.cost.toString(),
        profitPercentage: input.profitPercentage.toString(),
        version: 1,
      })
      .returning();
    return result[0];
  }

  async updateSparePart(id: string, input: SparePartUpdateInput, dbtx: any = db) {
    const updateData: any = {
      updatedAt: sql`NOW()`,
      version: sql`${spareParts.version} + 1`,
    };
    if (input.title !== undefined) updateData.title = input.title;
    if (input.condition !== undefined) updateData.condition = input.condition;
    if (input.customerId !== undefined) updateData.customerId = input.customerId;
    if (input.cost !== undefined) updateData.cost = input.cost.toString();
    if (input.profitPercentage !== undefined) updateData.profitPercentage = input.profitPercentage.toString();

    const result = await dbtx
      .update(spareParts)
      .set(updateData)
      .where(and(eq(spareParts.id, id), eq(spareParts.version, input.version)))
      .returning();

    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }

  async deleteSparePart(id: string, dbtx: any = db) {
    const result = await dbtx.delete(spareParts).where(eq(spareParts.id, id)).returning();
    if (result.length === 0) throw new ConcurrencyError();
  }
}

export const sparePartRepository = new SparePartRepository();
