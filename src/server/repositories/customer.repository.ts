import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import type { CustomerInput } from '@/schemas/customer.schema';

export class CustomerRepository {
  async getAllCustomers() {
    return await db.query.customers.findMany({
      orderBy: [desc(customers.createdAt)],
    });
  }

  async createCustomer(input: CustomerInput) {
    const result = await db.insert(customers).values({
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      documentNumber: input.documentNumber || null,
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
