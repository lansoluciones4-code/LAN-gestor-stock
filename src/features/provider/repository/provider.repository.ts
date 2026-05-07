import { desc, eq, sql, ilike, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { providers } from '@/lib/db/schema';
import type { ProviderInput, ProviderUpdateInput } from '@/features/provider/domain/provider.schema';
import { ConcurrencyError, DuplicateEntityError } from '@/lib/errors';

export class ProviderRepository {
  async getAllProviders() {
    return await db.query.providers.findMany({
      orderBy: [desc(providers.createdAt)],
    });
  }

  async checkHasRelations(id: string, dbtx: any = db) {
    const productsList = await dbtx.query.products.findMany({
      where: (p: any, { eq }: any) => eq(p.providerId, id),
      limit: 1,
    });
    return productsList.length > 0;
  }

  async updateActiveStatus(id: string, isActive: boolean, dbtx: any = db) {
    const result = await dbtx
      .update(providers)
      .set({
        isActive,
        updatedAt: sql`NOW()`,
        version: sql`${providers.version} + 1`,
      })
      .where(eq(providers.id, id))
      .returning();
    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }

  async createProvider(input: ProviderInput, dbtx: any = db) {
    // Check for existing (for reactivation logic)
    const existing = await dbtx.query.providers.findFirst({
      where: ilike(providers.name, input.name),
    });

    if (existing) {
      if (!existing.isActive) {
        // Reactivate
        const result = await dbtx
          .update(providers)
          .set({
            name: input.name,
            phone: input.phone || '',
            email: input.email || '',
            isActive: true,
            updatedAt: sql`NOW()`,
            version: sql`${providers.version} + 1`,
          })
          .where(eq(providers.id, existing.id))
          .returning();
        return { ...result[0], wasInactive: true };
      } else {
        throw new DuplicateEntityError();
      }
    }

    const result = await dbtx
      .insert(providers)
      .values({
        name: input.name,
        phone: input.phone || '',
        email: input.email || '',
        isActive: true,
        version: 1,
      })
      .returning();
    return result[0];
  }

  async updateProvider(id: string, input: ProviderUpdateInput, dbtx: any = db) {
    const updateData: any = {
      updatedAt: sql`NOW()`,
      version: sql`${providers.version} + 1`,
    };

    if (input.name !== undefined) {
      const existing = await dbtx.query.providers.findFirst({
        where: and(ilike(providers.name, input.name), sql`${providers.id} != ${id}`),
      });
      if (existing) throw new DuplicateEntityError();
      updateData.name = input.name;
    }
    if (input.phone !== undefined) updateData.phone = input.phone || '';
    if (input.email !== undefined) updateData.email = input.email || '';

    const result = await dbtx
      .update(providers)
      .set(updateData)
      .where(and(eq(providers.id, id), eq(providers.version, input.version)))
      .returning();

    if (result.length === 0) {
      throw new ConcurrencyError();
    }

    return result[0];
  }

  async deleteProvider(id: string, dbtx: any = db) {
    const result = await dbtx.delete(providers).where(eq(providers.id, id)).returning();
    if (result.length === 0) throw new ConcurrencyError();
  }
}

export const providerRepository = new ProviderRepository();
