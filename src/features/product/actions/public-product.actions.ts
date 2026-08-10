'use server';

import { z } from 'zod';
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
    const products = await productRepository.getLandingProducts();
    return z.array(productRowSchema).parse(products);
  } catch (error) {
    console.error('fetchLandingProducts error:', error);
    return [];
  }
}

export async function fetchProductById(id: string): Promise<ProductDef | null> {
  try {
    const product = await productRepository.getProductById(id);
    if (!product) return null;
    return productRowSchema.parse(product);
  } catch (error) {
    console.error('fetchProductById error:', error);
    return null;
  }
}
