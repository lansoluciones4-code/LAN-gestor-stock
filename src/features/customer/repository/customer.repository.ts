import { desc, eq, sql, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import type { CustomerInput, CustomerUpdateInput } from '@/features/customer/domain/customer.schema';
import { ConcurrencyError, DuplicateEntityError } from '@/lib/errors';

export class CustomerRepository {
  async getAllCustomers() {
    return await db.query.customers.findMany({
      orderBy: [desc(customers.createdAt)],
    });
  }

  async checkHasRelations(id: string, dbtx: any = db) {
    const sale = await dbtx.query.sales.findFirst({ where: (s: any, { eq }: any) => eq(s.customerId, id) });
    return !!sale;
  }

  async updateActiveStatus(id: string, isActive: boolean, dbtx: any = db) {
    const result = await dbtx
      .update(customers)
      .set({
        isActive,
        updatedAt: sql`NOW()`,
        version: sql`${customers.version} + 1`,
      })
      .where(eq(customers.id, id))
      .returning();
    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }

  async createCustomer(input: CustomerInput, dbtx: any = db) {
    if (input.documentNumber) {
      const normalizedInput = input.documentNumber.replace(/[.\-]/g, '');
      const existing = await dbtx.query.customers.findFirst({
        where: sql`REPLACE(REPLACE(${customers.documentNumber}, '.', ''), '-', '') ILIKE ${normalizedInput}`,
      });

      if (existing) {
        if (!existing.isActive) {
          const result = await dbtx
            .update(customers)
            .set({
              name: input.name,
              phone: input.phone || '',
              email: input.email || '',
              isActive: true,
              updatedAt: sql`NOW()`,
              version: sql`${customers.version} + 1`,
            })
            .where(eq(customers.id, existing.id))
            .returning();

          return { ...result[0], wasInactive: true };
        } else {
          throw new DuplicateEntityError();
        }
      }
    }

    const result = await dbtx
      .insert(customers)
      .values({
        name: input.name,
        phone: input.phone || '',
        email: input.email || '',
        documentNumber: input.documentNumber || '',
        isActive: true,
        version: 1,
      })
      .returning();

    return result[0];
  }

  async updateCustomer(id: string, input: CustomerUpdateInput, dbtx: any = db) {
    const updateData: any = {
      updatedAt: sql`NOW()`,
      version: sql`${customers.version} + 1`,
    };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.phone !== undefined) updateData.phone = input.phone || '';
    if (input.email !== undefined) updateData.email = input.email || '';

    if (input.documentNumber !== undefined) {
      const normalizedInput = (input.documentNumber || '').replace(/[.\-]/g, '');
      const existing = await dbtx.query.customers.findFirst({
        where: and(sql`REPLACE(REPLACE(${customers.documentNumber}, '.', ''), '-', '') ILIKE ${normalizedInput}`, sql`${customers.id} != ${id}`),
      });

      if (existing) {
        throw new DuplicateEntityError();
      }

      updateData.documentNumber = input.documentNumber || '';
    }

    const result = await dbtx
      .update(customers)
      .set(updateData)
      .where(and(eq(customers.id, id), eq(customers.version, input.version)))
      .returning();

    if (result.length === 0) {
      throw new ConcurrencyError();
    }

    return result[0];
  }

  async deleteCustomer(id: string, dbtx: any = db) {
    const result = await dbtx.delete(customers).where(eq(customers.id, id)).returning();
    if (result.length === 0) throw new ConcurrencyError();
  }
}

export const customerRepository = new CustomerRepository();
