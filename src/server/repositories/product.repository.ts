import { desc, eq, sql, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products, devices, providers, saleItems } from '@/lib/db/schema';
import type { ProductInput } from '@/schemas/product.schema';

export class ProductRepository {
  async checkHasRelations(id: string) {
    const items = await db.query.saleItems.findFirst({
      where: (items, { eq }) => eq(items.productId, id),
    });
    return !!items;
  }

  async getAllProducts() {
    return await db.query.products.findMany({
      where: (products, { gt }) => gt(products.stock, 0),
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
