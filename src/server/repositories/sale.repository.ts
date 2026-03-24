import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sales, saleItems, products, devices } from '@/lib/db/schema';
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

  async createSale(vendorId: string, input: SaleInput) {
    return await db.transaction(async (tx) => {
      // 1. Validate Stock for all items first
      for (const item of input.items) {
        const prod = await tx.query.products.findFirst({
          where: eq(products.id, item.productId),
          columns: { stock: true, id: true },
          with: { device: { columns: { name: true } } }
        });

        if (!prod || prod.stock < item.quantity) {
          throw new Error(`Stock insuficiente para el producto: ${prod?.device?.name || 'ID ' + item.productId}. Disponible: ${prod?.stock || 0}`);
        }
      }

      // 2. Create Sale entry
      const [sale] = await tx
        .insert(sales)
        .values({
          customerId: input.customerId,
          vendorId,
          total: input.total.toString(), 
        })
        .returning();

      // 3. Insert items AND update stock
      for (const item of input.items) {
        await tx.insert(saleItems).values({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          subtotal: item.subtotal.toString(),
        });

        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: sql`NOW()`,
          })
          .where(eq(products.id, item.productId));
      }

      return sale;
    });
  }

  /**
   * Deleting a sale should restore stock.
   */
  async deleteSale(id: string) {
    return await db.transaction(async (tx) => {
      // 1. Get items to restore stock
      const items = await tx.query.saleItems.findMany({
        where: eq(saleItems.saleId, id),
      });

      for (const item of items) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} + ${item.quantity}`,
            updatedAt: sql`NOW()`,
          })
          .where(eq(products.id, item.productId));
      }

      // 2. Delete entries
      await tx.delete(saleItems).where(eq(saleItems.saleId, id));
      await tx.delete(sales).where(eq(sales.id, id));
    });
  }
}

export const saleRepository = new SaleRepository();
