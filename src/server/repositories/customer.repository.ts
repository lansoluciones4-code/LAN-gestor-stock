import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import type { CustomerInput } from '@/schemas/customer.schema';

export class CustomerRepository {
  async getAllCustomers(includeInactive = false) {
    console.log(`[CustomerRepository] Consultando clientes (includeInactive=${includeInactive})...`);
    return await db.query.customers.findMany({
      where: includeInactive ? undefined : eq(customers.isActive, true),
      orderBy: [desc(customers.createdAt)],
    });
  }

  async checkHasRelations(id: string) {
    console.log(`[CustomerRepository] Verificando relaciones (FK) para cliente ID: ${id}...`);
    const productsList = await db.query.products.findMany({
      where: (p, { eq }) => eq(p.customerId, id),
      limit: 1,
    });
    
    const salesList = await db.query.sales.findMany({
      where: (s, { eq }) => eq(s.customerId, id),
      limit: 1,
    });
    
    return productsList.length > 0 || salesList.length > 0;
  }

  async updateActiveStatus(id: string, isActive: boolean) {
    console.log(`[CustomerRepository] Actualizando status de cliente ID: ${id} a ${isActive}...`);
    const result = await db.update(customers)
      .set({ isActive, updatedAt: sql`NOW()` })
      .where(eq(customers.id, id))
      .returning();
    return result[0];
  }

  async createCustomer(input: CustomerInput) {
    console.log(`[CustomerRepository] Insertando nuevo cliente en BD: ${input.name}...`);
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
    console.log(`[CustomerRepository] Actualizando datos de cliente ID: ${id}...`);
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
    console.log(`[CustomerRepository] Eliminando cliente ID: ${id} de BD...`);
    await db.delete(customers).where(eq(customers.id, id));
  }
}

export const customerRepository = new CustomerRepository();
