import { desc, eq, sql, and, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sales, saleItems, products, customers } from '@/lib/db/schema';
import type { SaleInput } from '@/schemas/sale.schema';

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
        throw new Error(`Stock insuficiente para el producto: ${prod?.device?.name || 'ID ' + item.productId}. Disponible: ${prod?.stock || 0}`);
      }
    }

    // 2. Create Sale entry
    const [sale] = await dbtx
      .insert(sales)
      .values({
        customerId: input.customerId,
        vendorId,
        total: input.total.toString(),
      })
      .returning();

    // 2.5 Activate customer if provided (re-activate if inactive)
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
        subtotal: item.subtotal.toString(),
      });

      // Atomic Update with Stock Validation (Concurrency safe)
      const updated = await dbtx
        .update(products)
        .set({
          stock: sql`${products.stock} - ${item.quantity}`,
          updatedAt: sql`NOW()`,
        })
        .where(
          and(
            eq(products.id, item.productId),
            gte(products.stock, item.quantity)
          )
        )
        .returning();

      if (updated.length === 0) {
        throw new Error(`Stock insuficiente para el producto ID ${item.productId} (pudo haber sido vendido mientras procesabas).`);
      }
    }

    return sale;
  }

  /**
   * Deleting a sale should restore stock.
   */
  async deleteSale(id: string, dbtx: any = db) {
    // 1. Get items to restore stock
    const items = await dbtx.query.saleItems.findMany({
      where: eq(saleItems.saleId, id),
    });

    for (const item of items) {
      await dbtx
        .update(products)
        .set({
          stock: sql`${products.stock} + ${item.quantity}`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(products.id, item.productId));
    }

    // 2. Delete entries
    await dbtx.delete(saleItems).where(eq(saleItems.saleId, id));
    await dbtx.delete(sales).where(eq(sales.id, id));
  }
}

export const saleRepository = new SaleRepository();
