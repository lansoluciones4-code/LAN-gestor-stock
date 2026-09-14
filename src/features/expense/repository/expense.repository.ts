import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db/schema';
import type { ExpenseInput, ExpenseUpdateInput } from '@/features/expense/domain/expense.schema';
import { ConcurrencyError } from '@/lib/errors';
import { argDateRangeBounds } from '@/lib/utils';

export class ExpenseRepository {
  async getExpensesByDateRange(start: Date, end: Date, dbtx: any = db) {
    return await dbtx.query.expenses.findMany({
      where: and(gte(expenses.date, start), lte(expenses.date, end)),
      orderBy: [desc(expenses.date)],
      with: { provider: { columns: { id: true, name: true } } },
    });
  }

  async getExpenseById(id: string, dbtx: any = db) {
    return await dbtx.query.expenses.findFirst({
      where: (e: any, { eq }: any) => eq(e.id, id),
      with: { provider: { columns: { id: true, name: true } } },
    });
  }

  async createExpense(input: ExpenseInput, dbtx: any = db) {
    const result = await dbtx
      .insert(expenses)
      .values({
        section: input.section,
        providerId: input.providerId,
        pointOfSale: input.pointOfSale,
        receiptNumber: input.receiptNumber,
        amount: input.amount.toFixed(2),
        // Mismo criterio de zona horaria que argDateRangeBounds: la fecha de la boleta es un día
        // calendario en Argentina, no un instante — se ancla a las 00:00 -03:00 de ese día.
        date: argDateRangeBounds(input.date, input.date).start,
        version: 1,
      })
      .returning();
    return result[0];
  }

  async updateExpense(id: string, input: ExpenseUpdateInput, dbtx: any = db) {
    const result = await dbtx
      .update(expenses)
      .set({
        section: input.section,
        providerId: input.providerId,
        pointOfSale: input.pointOfSale,
        receiptNumber: input.receiptNumber,
        amount: input.amount.toFixed(2),
        date: argDateRangeBounds(input.date, input.date).start,
        updatedAt: sql`NOW()`,
        version: sql`${expenses.version} + 1`,
      })
      .where(and(eq(expenses.id, id), eq(expenses.version, input.version)))
      .returning();

    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }

  async deleteExpense(id: string, dbtx: any = db) {
    const result = await dbtx.delete(expenses).where(eq(expenses.id, id)).returning();
    if (result.length === 0) throw new ConcurrencyError();
  }
}

export const expenseRepository = new ExpenseRepository();
