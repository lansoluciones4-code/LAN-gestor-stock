import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products, productReturns } from '@/lib/db/schema';

export class ProductReturnRepository {
  async getAllReturns() {
    return await db.query.productReturns.findMany({
      with: {
        product: { with: { device: true } },
        user: true,
      },
      orderBy: [desc(productReturns.createdAt)],
    });
  }

  async createReturn(productId: string, userId: string, quantity: number, reason: string, amount: number, dbtx: any = db) {
    const [created] = await dbtx
      .insert(productReturns)
      .values({
        productId,
        userId,
        quantity,
        reason,
        amount,
      })
      .returning();

    // Reponer stock — sumar nunca puede violar stock >= 0, así que no hace falta guard de concurrencia.
    const updated = await dbtx
      .update(products)
      .set({
        stock: sql`${products.stock} + ${quantity}`,
        version: sql`${products.version} + 1`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(products.id, productId))
      .returning();

    if (updated.length === 0) {
      throw new Error('No se pudo procesar la devolución: producto no encontrado.');
    }

    return created;
  }
}

export const productReturnRepository = new ProductReturnRepository();
