import { asc, and, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { counters } from '@/lib/db/schema';
import type { CounterInput, CounterUpdateInput } from '@/features/counter/domain/counter.schema';
import { ConcurrencyError } from '@/lib/errors';

export class CounterRepository {
  async getAllCounters(dbtx: any = db) {
    return await dbtx.query.counters.findMany({
      orderBy: [asc(counters.createdAt)],
    });
  }

  async createCounter(input: CounterInput, dbtx: any = db) {
    const result = await dbtx
      .insert(counters)
      .values({
        title: input.title,
        quantity: input.quantity,
        version: 1,
      })
      .returning();
    return result[0];
  }

  async updateCounter(id: string, input: CounterUpdateInput, dbtx: any = db) {
    const updateData: any = {
      updatedAt: sql`NOW()`,
      version: sql`${counters.version} + 1`,
    };
    if (input.title !== undefined) updateData.title = input.title;
    if (input.quantity !== undefined) updateData.quantity = input.quantity;

    const result = await dbtx
      .update(counters)
      .set(updateData)
      .where(and(eq(counters.id, id), eq(counters.version, input.version)))
      .returning();

    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }

  async deleteCounter(id: string, dbtx: any = db) {
    const result = await dbtx.delete(counters).where(eq(counters.id, id)).returning();
    if (result.length === 0) throw new ConcurrencyError();
  }

  /** Descuenta `amount` de la cantidad, nunca deja el contador en negativo (guard atómico en el WHERE). */
  async decrementCounter(id: string, amount: number, dbtx: any = db) {
    const result = await dbtx
      .update(counters)
      .set({
        quantity: sql`${counters.quantity} - ${amount}`,
        version: sql`${counters.version} + 1`,
        updatedAt: sql`NOW()`,
      })
      .where(and(eq(counters.id, id), gte(counters.quantity, amount)))
      .returning();

    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }
}

export const counterRepository = new CounterRepository();
