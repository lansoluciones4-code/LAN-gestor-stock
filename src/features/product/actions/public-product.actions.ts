'use server';

import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { productViews } from '@/lib/db/schema';
import { productRepository } from '@/features/product/repository/product.repository';
import { productRowSchema, type ProductDef } from '@/features/product/domain/product.schema';

/**
 * Únicas Server Actions de "product" que el catálogo público (Vercel) necesita.
 * Viven en un archivo separado de product.actions.ts a propósito: scripts/prepare-vercel-build.js
 * borra src/app/(main) del build público, y ese archivo concentra el resto de las acciones
 * (crear/editar/eliminar producto, etc.) para que ninguna quede alcanzable desde internet.
 */

export async function fetchLandingProducts(): Promise<ProductDef[]> {
  try {
    const [products, views] = await Promise.all([productRepository.getLandingProducts(), db.select().from(productViews)]);
    const viewsByProduct = new Map(views.map((v) => [v.productId, v.viewCount]));
    const withViews = products.map((p) => ({ ...p, viewCount: viewsByProduct.get(p.id) ?? 0 }));
    return z.array(productRowSchema).parse(withViews);
  } catch (error) {
    console.error('fetchLandingProducts error:', error);
    return [];
  }
}

export async function fetchProductById(id: string): Promise<ProductDef | null> {
  try {
    const product = await productRepository.getProductById(id);
    // Un producto oculto del catálogo (showOnLanding=false) tampoco debe ser accesible por URL directa.
    if (!product || !product.showOnLanding) return null;
    return productRowSchema.parse(product);
  } catch (error) {
    console.error('fetchProductById error:', error);
    return null;
  }
}

/** Suma 1 vista al contador de un producto (Paso 9). El cliente ya dedupe por sessionStorage — acá no se revalida eso. */
export async function incrementProductViewAction(productId: string): Promise<void> {
  try {
    await db
      .insert(productViews)
      .values({ productId, viewCount: 1 })
      .onConflictDoUpdate({
        target: productViews.productId,
        set: { viewCount: sql`${productViews.viewCount} + 1`, updatedAt: sql`NOW()` },
      });
  } catch (error) {
    // Un fallo al contar una vista nunca debe romper la página del visitante.
    console.error('incrementProductViewAction error:', error);
  }
}
