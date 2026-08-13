import { desc, eq, sql, ilike, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { technicalServices } from '@/lib/db/schema';
import type { TechnicalServiceInput, TechnicalServiceUpdateInput } from '@/features/technical-service/domain/technical-service.schema';
import { ConcurrencyError, DuplicateEntityError } from '@/lib/errors';

export class TechnicalServiceRepository {
  async getAllTechnicalServices() {
    return await db.query.technicalServices.findMany({
      orderBy: [desc(technicalServices.createdAt)],
    });
  }

  async checkHasRelations(id: string, dbtx: any = db) {
    const saleItem = await dbtx.query.saleServiceItems.findFirst({ where: (s: any, { eq }: any) => eq(s.technicalServiceId, id) });
    return !!saleItem;
  }

  async updateActiveStatus(id: string, isActive: boolean, dbtx: any = db) {
    const result = await dbtx
      .update(technicalServices)
      .set({
        isActive,
        updatedAt: sql`NOW()`,
        version: sql`${technicalServices.version} + 1`,
      })
      .where(eq(technicalServices.id, id))
      .returning();
    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }

  async createTechnicalService(input: TechnicalServiceInput, dbtx: any = db) {
    // Check for existing (for reactivation logic)
    const existing = await dbtx.query.technicalServices.findFirst({
      where: ilike(technicalServices.name, input.name),
    });

    if (existing) {
      if (!existing.isActive) {
        // Reactivate
        const result = await dbtx
          .update(technicalServices)
          .set({
            name: input.name,
            description: input.description || '',
            value: input.value.toString(),
            isActive: true,
            updatedAt: sql`NOW()`,
            version: sql`${technicalServices.version} + 1`,
          })
          .where(eq(technicalServices.id, existing.id))
          .returning();
        return { ...result[0], wasInactive: true };
      } else {
        throw new DuplicateEntityError();
      }
    }

    const result = await dbtx
      .insert(technicalServices)
      .values({
        name: input.name,
        description: input.description || '',
        value: input.value.toString(),
        isActive: true,
        version: 1,
      })
      .returning();
    return result[0];
  }

  async updateTechnicalService(id: string, input: TechnicalServiceUpdateInput, dbtx: any = db) {
    const updateData: any = {
      updatedAt: sql`NOW()`,
      version: sql`${technicalServices.version} + 1`,
    };

    if (input.name !== undefined) {
      const existing = await dbtx.query.technicalServices.findFirst({
        where: and(ilike(technicalServices.name, input.name), sql`${technicalServices.id} != ${id}`),
      });
      if (existing) throw new DuplicateEntityError();
      updateData.name = input.name;
    }
    if (input.description !== undefined) updateData.description = input.description || '';
    if (input.value !== undefined) updateData.value = input.value.toString();

    const result = await dbtx
      .update(technicalServices)
      .set(updateData)
      .where(and(eq(technicalServices.id, id), eq(technicalServices.version, input.version)))
      .returning();

    if (result.length === 0) {
      throw new ConcurrencyError();
    }

    return result[0];
  }

  async deleteTechnicalService(id: string, dbtx: any = db) {
    const result = await dbtx.delete(technicalServices).where(eq(technicalServices.id, id)).returning();
    if (result.length === 0) throw new ConcurrencyError();
  }
}

export const technicalServiceRepository = new TechnicalServiceRepository();
