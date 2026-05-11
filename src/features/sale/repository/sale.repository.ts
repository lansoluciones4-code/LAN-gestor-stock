import { desc, eq, sql, and, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sales, saleItems, products, customers, salePayments } from '@/lib/db/schema';
import type { SaleInput } from '@/features/sale/domain/sale.schema';
import { ConcurrencyError } from '@/lib/errors';

export class SaleRepository {
  async getAllSales() {
    return await db.query.sales.findMany({
      orderBy: [desc(sales.createdAt)],
      with: {
        customer: {
          columns: { id: true, name: true },
        },
        vendor: {
          columns: { id: true, username: true },
        },
        items: {
          with: {
            product: {
              with: {
                device: {
                  columns: { name: true },
                },
              },
            },
          },
        },
        payments: true,
      },
    });
  }

  async getSaleById(id: string) {
    return await db.query.sales.findFirst({
      where: eq(sales.id, id),
      with: {
        customer: true,
        vendor: true,
        items: {
          with: {
            product: {
              with: {
                device: true,
              },
            },
          },
        },
        payments: true,
      },
    });
  }

  async createSale(vendorId: string, input: SaleInput, dbtx: any = db) {
    // 1. Validate Stock for all items first
    for (const item of input.items) {
      const prod = await dbtx.query.products.findFirst({
        where: eq(products.id, item.productId),
        columns: { stock: true, id: true },
        with: { device: { columns: { name: true } } },
      });

      if (!prod || prod.stock < item.quantity) {
        throw new Error(`Stock insuficiente para: ${prod?.device?.name || 'Producto'}. Disponible: ${prod?.stock || 0}`);
      }
    }

    // 2. Create Sale entry
    const [sale] = await dbtx
      .insert(sales)
      .values({
        customerId: input.customerId,
        vendorId,
        total: input.total.toString(),
        discountAmount: input.discountAmount ? input.discountAmount.toString() : '0',
        discountPercentage: input.discountPercentage ? input.discountPercentage.toString() : '0',
      })
      .returning();

    // 2.5 Ensure customer is active
    if (input.customerId) {
      await dbtx.update(customers).set({ isActive: true }).where(eq(customers.id, input.customerId));
    }

    // 3. Insert items AND update stock
    for (const item of input.items) {
      await dbtx.insert(saleItems).values({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        unitCost: item.unitCost.toString(),
        subtotal: item.subtotal.toString(),
      });

      // Atomic Update with Stock Validation
      const updated = await dbtx
        .update(products)
        .set({
          stock: sql`${products.stock} - ${item.quantity}`,
          version: sql`${products.version} + 1`,
          updatedAt: sql`NOW()`,
        })
        .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
        .returning();

      if (updated.length === 0) {
        throw new Error('Conflicto de stock: el inventario cambió durante la operación.');
      }
    }

    // 4. Insert payments
    if (input.payments && input.payments.length > 0) {
      for (const p of input.payments) {
        await dbtx.insert(salePayments).values({
          saleId: sale.id,
          type: p.type as any,
          amount: p.amount.toString(),
        });
      }
    }

    return sale;
  }

  async deleteSale(id: string, dbtx: any = db) {
    // 1. Lock the sale to prevent double-deletion and race conditions
    // Using FOR UPDATE ensures no other transaction can delete or modify this sale concurrently.
    const lockedSale = await dbtx.select({ id: sales.id }).from(sales).where(eq(sales.id, id)).for('update');
    if (lockedSale.length === 0) {
      throw new ConcurrencyError();
    }

    const items = await dbtx.query.saleItems.findMany({
      where: eq(saleItems.saleId, id),
    });

    for (const item of items) {
      await dbtx
        .update(products)
        .set({
          stock: sql`${products.stock} + ${item.quantity}`,
          version: sql`${products.version} + 1`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(products.id, item.productId));
    }

    await dbtx.delete(saleItems).where(eq(saleItems.saleId, id));
    await dbtx.delete(salePayments).where(eq(salePayments.saleId, id));
    
    // Final delete of the locked sale record
    await dbtx.delete(sales).where(eq(sales.id, id));
  }
}

export const saleRepository = new SaleRepository();
