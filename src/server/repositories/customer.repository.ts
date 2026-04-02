import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import type { CustomerInput } from '@/schemas/customer.schema';

export class CustomerRepository {
  async getAllCustomers(includeInactive = false) {
    return await db.query.customers.findMany({
      where: includeInactive ? undefined : eq(customers.isActive, true),
      orderBy: [desc(customers.createdAt)],
    });
  }

  async checkHasRelations(id: string, dbtx: any = db) {
    const productsList = await dbtx.query.products.findMany({
      where: (p: any, { eq }: any) => eq(p.customerId, id),
      limit: 1,
    });

    const salesList = await dbtx.query.sales.findMany({
      where: (s: any, { eq }: any) => eq(s.customerId, id),
      limit: 1,
    });

    return productsList.length > 0 || salesList.length > 0;
  }

  async updateActiveStatus(id: string, isActive: boolean, dbtx: any = db) {
    const result = await dbtx
      .update(customers)
      .set({ isActive, updatedAt: sql`NOW()` })
      .where(eq(customers.id, id))
      .returning();
    return result[0];
  }

  async createCustomer(input: CustomerInput, dbtx: any = db) {
    if (input.documentNumber) {
      const existing = await dbtx.query.customers.findFirst({
        where: sql`${customers.documentNumber} ILIKE ${input.documentNumber}`,
      });

      if (existing) {
        if (existing.isActive) {
          throw new Error(`Ya existe un cliente con el documento ${input.documentNumber}.`);
        }
        // Reactivate
        const result = await dbtx
          .update(customers)
          .set({
            name: input.name,
            phone: input.phone || null,
            email: input.email || null,
            isActive: true,
            updatedAt: sql`NOW()`,
          })
          .where(eq(customers.id, existing.id))
          .returning();
        return { ...result[0], wasInactive: true };
      }
    }

    const result = await dbtx
      .insert(customers)
      .values({
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        documentNumber: input.documentNumber || null,
        isActive: true,
      })
      .returning();

    return result[0];
  }

  async updateCustomer(id: string, input: CustomerInput, dbtx: any = db) {
    if (input.documentNumber) {
      const existing = await dbtx.query.customers.findFirst({
        where: sql`${customers.documentNumber} ILIKE ${input.documentNumber}`,
      });

      if (existing && existing.id !== id) {
        throw new Error(`El número de documento ${input.documentNumber} ya está registrado en otro cliente.`);
      }
    }

    const result = await dbtx
      .update(customers)
      .set({
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        documentNumber: input.documentNumber || null,
        updatedAt: sql`NOW()`,
      })
      .where(eq(customers.id, id))
      .returning();

    return result[0];
  }

  async deleteCustomer(id: string, dbtx: any = db) {
    await dbtx.delete(customers).where(eq(customers.id, id));
  }
}

export const customerRepository = new CustomerRepository();
