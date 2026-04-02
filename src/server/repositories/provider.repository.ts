import { desc, eq, sql, ilike, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { providers } from '@/lib/db/schema';
import type { ProviderInput } from '@/schemas/provider.schema';

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
      .set({ isActive, updatedAt: sql`NOW()` })
      .where(eq(providers.id, id))
      .returning();
    return result[0];
  }

  async createProvider(input: ProviderInput, dbtx: any = db) {
    // Check for existing (case-insensitive)
    const existing = await dbtx.query.providers.findFirst({
      where: ilike(providers.name, input.name),
    });

    if (existing) {
      if (existing.isActive) {
        throw new Error('Ya existe un proveedor registrado con ese nombre.');
      }
      // Reactivate
      const result = await dbtx
        .update(providers)
        .set({
          name: input.name, // Update casing
          phone: input.phone || null,
          email: input.email || null,
          isActive: true,
          updatedAt: sql`NOW()`,
        })
        .where(eq(providers.id, existing.id))
        .returning();
      return { ...result[0], wasInactive: true };
    }

    const result = await dbtx
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

  async updateProvider(id: string, input: ProviderInput, dbtx: any = db) {
    // Check duplication ignoring self
    const existing = await dbtx.query.providers.findFirst({
      where: ilike(providers.name, input.name),
    });

    if (existing && existing.id !== id) {
      throw new Error('El nombre de proveedor ya está en uso por otro registro.');
    }

    const result = await dbtx
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

  async deleteProvider(id: string, dbtx: any = db) {
    await dbtx.delete(providers).where(eq(providers.id, id));
  }
}

export const providerRepository = new ProviderRepository();
