import { desc, eq, sql, and, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products, productLosses } from '@/lib/db/schema';
import type { ProductInput, ProductUpdateInput } from '@/features/product/domain/product.schema';
import { ConcurrencyError } from '@/lib/errors';

export class ProductRepository {
  async checkHasRelations(id: string, dbtx: any = db) {
    const [item, loss] = await Promise.all([dbtx.query.saleItems.findFirst({ where: (items: any, { eq }: any) => eq(items.productId, id) }), dbtx.query.productLosses.findFirst({ where: (l: any, { eq }: any) => eq(l.productId, id) })]);
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
      with: {
        device: true,
        provider: true,
        images: true,
      },
    });
  }

  async registerLoss(productId: string, userId: string, quantity: number, reason: string, dbtx: any = db) {
    // 1. Insert loss record
    await dbtx.insert(productLosses).values({
      productId,
      userId,
      quantity,
      reason,
    });

    // 2. Decrement stock and increment version
    const updated = await dbtx
      .update(products)
      .set({
        stock: sql`${products.stock} - ${quantity}`,
        version: sql`${products.version} + 1`,
        updatedAt: sql`NOW()`,
      })
      .where(and(eq(products.id, productId), gte(products.stock, quantity)))
      .returning();

    if (updated.length === 0) {
      // This could be because of insufficient stock or concurrency
      throw new Error('No se pudo procesar la pérdida: stock insuficiente o conflicto de datos.');
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
        version: 1,
      })
      .returning();
    return result[0];
  }

  async updateProduct(id: string, input: ProductUpdateInput, dbtx: any = db) {
    const updateData: any = {
      updatedAt: sql`NOW()`,
      version: sql`${products.version} + 1`,
    };

    if (input.deviceId !== undefined) updateData.deviceId = input.deviceId;
    if (input.providerId !== undefined) updateData.providerId = input.providerId;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.purchasePrice !== undefined) updateData.purchasePrice = input.purchasePrice?.toString();
    if (input.salePrice !== undefined) updateData.salePrice = input.salePrice?.toString();

    if (input.stockDelta !== undefined) {
      updateData.stock = sql`${products.stock} + ${input.stockDelta}`;
    } else if (input.stock !== undefined) {
      updateData.stock = input.stock;
    }

    const result = await dbtx
      .update(products)
      .set(updateData)
      .where(and(eq(products.id, id), eq(products.version, input.version)))
      .returning();

    if (result.length === 0) {
      throw new ConcurrencyError();
    }
    return result[0];
  }

  async deleteProduct(id: string, dbtx: any = db) {
    const result = await dbtx.delete(products).where(eq(products.id, id)).returning();
    if (result.length === 0) throw new ConcurrencyError();
  }

  async getLandingProducts() {
    return await db.query.products.findMany({
      where: (products, { eq }) => eq(products.showOnLanding, true),
      with: {
        device: true,
        images: true,
      },
      orderBy: [desc(products.stock), desc(products.createdAt)],
    });
  }

  async toggleVisibility(id: string, isVisible: boolean, dbtx: any = db) {
    const result = await dbtx
      .update(products)
      .set({
        showOnLanding: isVisible,
        updatedAt: sql`NOW()`,
        version: sql`${products.version} + 1`,
      })
      .where(eq(products.id, id))
      .returning();
    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }
}

export const productRepository = new ProductRepository();
