import { desc, eq, sql, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products, devices, providers, saleItems, productLosses } from '@/lib/db/schema';
import type { ProductInput } from '@/schemas/product.schema';

export class ProductRepository {
  async checkHasRelations(id: string) {
    const [item, loss] = await Promise.all([
      db.query.saleItems.findFirst({ where: (items, { eq }) => eq(items.productId, id) }),
      db.query.productLosses.findFirst({ where: (l, { eq }) => eq(l.productId, id) }),
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

  async registerLoss(productId: string, userId: string, quantity: number, reason: string) {
    return await db.transaction(async (tx) => {
      // 1. Insert loss record
      await tx.insert(productLosses).values({
        productId,
        userId,
        quantity,
        reason,
      });

      // 2. Decrement stock
      const product = await tx.query.products.findFirst({
        where: (p, { eq }) => eq(p.id, productId),
      });

      if (!product) throw new Error('Producto no encontrado');
      if (product.stock < quantity) throw new Error('Stock insuficiente para registrar pérdida');

      await tx
        .update(products)
        .set({
          stock: product.stock - quantity,
          updatedAt: sql`NOW()`,
        })
        .where(eq(products.id, productId));

      return true;
    });
  }

  async createProduct(input: ProductInput) {
    const result = await db
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

  async updateProduct(id: string, input: ProductInput) {
    const result = await db
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

  async deleteProduct(id: string) {
    await db.delete(products).where(eq(products.id, id));
  }
}

export const productRepository = new ProductRepository();
