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

  async checkHasRelations(id: string) {
    // Check if customer has products (or sales in future)
    const productsList = await db.query.products.findMany({
      where: (p, { eq }) => eq(p.customerId, id),
      limit: 1,
    });
    return productsList.length > 0;
  }

  async updateActiveStatus(id: string, isActive: boolean) {
    const result = await db.update(customers)
      .set({ isActive, updatedAt: sql`NOW()` })
      .where(eq(customers.id, id))
      .returning();
    return result[0];
  }

  async createCustomer(input: CustomerInput) {
    const result = await db.insert(customers).values({
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      documentNumber: input.documentNumber || null,
      isActive: true,
    }).returning();
    
    return result[0];
  }

  async updateCustomer(id: string, input: CustomerInput) {
    const result = await db.update(customers).set({
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

  async deleteCustomer(id: string) {
    await db.delete(customers).where(eq(customers.id, id));
  }
}

export const customerRepository = new CustomerRepository();
