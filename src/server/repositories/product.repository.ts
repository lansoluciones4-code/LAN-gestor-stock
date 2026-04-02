import { desc, eq, sql, and, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products, devices, providers, saleItems, productLosses } from '@/lib/db/schema';
import type { ProductInput } from '@/schemas/product.schema';

export class ProductRepository {
  async checkHasRelations(id: string, dbtx: any = db) {
    const [item, loss] = await Promise.all([
      dbtx.query.saleItems.findFirst({ where: (items: any, { eq }: any) => eq(items.productId, id) }), 
      dbtx.query.productLosses.findFirst({ where: (l: any, { eq }: any) => eq(l.productId, id) })
    ]);
    return !!item || !!loss;
  }

  async getAllProducts() {
    return await db.query.products.findMany({
      with: {
        device: true,
        provider: true,
      },
      orderBy: [desc(products.createdAt)],
    });
  }

  async getProductById(id: string) {
    return await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, id),
    });
  }

  async registerLoss(productId: string, userId: string, quantity: number, reason: string, dbtx: any = db) {
    // If dbtx is the main db, we use it directly or it will create a new transaction if it's the tx object
    // Drizzle's db.transaction is re-entrant if handled correctly, but it's safer to just use dbtx
    
    // 1. Insert loss record
    await dbtx.insert(productLosses).values({
      productId,
      userId,
      quantity,
      reason,
    });

    // 2. Decrement stock
    const product = await dbtx.query.products.findFirst({
      where: (p: any, { eq }: any) => eq(p.id, productId),
    });

    if (!product) throw new Error('Producto no encontrado');
    if (product.stock < quantity) throw new Error('Stock insuficiente para registrar pérdida');

    const updated = await dbtx
      .update(products)
      .set({
        stock: sql`${products.stock} - ${quantity}`,
        updatedAt: sql`NOW()`,
      })
      .where(and(eq(products.id, productId), gte(products.stock, quantity)))
      .returning();

    if (updated.length === 0) {
      throw new Error('Stock insuficiente para registrar la pérdida.');
    }

    return true;
  }

  async createProduct(input: ProductInput, dbtx: any = db) {
    const result = await dbtx
      .insert(products)
      .values({
        deviceId: input.deviceId,
        providerId: input.providerId,
        description: input.description,
        purchasePrice: input.purchasePrice.toString(),
        salePrice: input.salePrice.toString(),
        stock: input.stock,
      })
      .returning();
    return result[0];
  }

  async updateProduct(id: string, input: ProductInput, dbtx: any = db) {
    const result = await dbtx
      .update(products)
      .set({
        deviceId: input.deviceId,
        providerId: input.providerId,
        description: input.description,
        purchasePrice: input.purchasePrice.toString(),
        salePrice: input.salePrice.toString(),
        stock: input.stock,
        updatedAt: sql`NOW()`,
      })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: string, dbtx: any = db) {
    await dbtx.delete(products).where(eq(products.id, id));
  }
}

export const productRepository = new ProductRepository();
