import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { providers } from '@/lib/db/schema';
import type { ProviderInput } from '@/schemas/provider.schema';

export class ProviderRepository {
  async getAllProviders() {
    return await db.query.providers.findMany({
      orderBy: [desc(providers.createdAt)],
    });
  }

  async createProvider(input: ProviderInput) {
    const result = await db.insert(providers).values({
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
    }).returning();
    return result[0];
  }

  async updateProvider(id: string, input: ProviderInput) {
    const result = await db.update(providers).set({
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
