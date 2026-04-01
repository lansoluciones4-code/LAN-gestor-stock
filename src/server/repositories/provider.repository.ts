import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { providers } from '@/lib/db/schema';
import type { ProviderInput } from '@/schemas/provider.schema';

export class ProviderRepository {
  async getAllProviders(includeInactive = false) {
    return await db.query.providers.findMany({
      where: includeInactive ? undefined : eq(providers.isActive, true),
      orderBy: [desc(providers.createdAt)],
    });
  }

  async checkHasRelations(id: string) {
    const productsList = await db.query.products.findMany({
      where: (p, { eq }) => eq(p.providerId, id),
      limit: 1,
    });
    return productsList.length > 0;
  }

  async updateActiveStatus(id: string, isActive: boolean) {
    const result = await db
      .update(providers)
      .set({ isActive, updatedAt: sql`NOW()` })
      .where(eq(providers.id, id))
      .returning();
    return result[0];
  }

  async createProvider(input: ProviderInput) {
    const result = await db
      .insert(providers)
      .values({
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        isActive: true,
      })
      .returning();
    return result[0];
  }

  async updateProvider(id: string, input: ProviderInput) {
    const result = await db
      .update(providers)
      .set({
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        updatedAt: sql`NOW()`,
      })
      .where(eq(providers.id, id))
      .returning();

    return result[0];
  }

  async deleteProvider(id: string) {
    await db.delete(providers).where(eq(providers.id, id));
  }
}

export const providerRepository = new ProviderRepository();
