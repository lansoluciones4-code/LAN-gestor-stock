import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { providers } from '@/lib/db/schema';

export class ProviderRepository {
  async getAllProviders() {
    return await db.query.providers.findMany({
      orderBy: [desc(providers.createdAt)],
    });
  }
}

export const providerRepository = new ProviderRepository();
