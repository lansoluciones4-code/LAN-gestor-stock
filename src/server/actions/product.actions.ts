'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { productRepository } from '@/server/repositories/product.repository';
import { deviceRepository } from '@/server/repositories/device.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { productSchema, productDefSchema, ProductInput, type ProductDef, productUpdateSchema, type ProductUpdateInput } from '@/schemas/product.schema';
import { providerDefSchema, type ProviderDef } from '@/schemas/provider.schema';
import { deviceDefSchema, type DeviceDef } from '@/schemas/device.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';
import { ConcurrencyError } from '@/lib/errors';

import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';

export async function fetchProducts(): Promise<ProductDef[]> {
  try {
    const products = await productRepository.getAllProducts();
    const formatted = products.map((p) => ({
      ...p,
      salePrice: parseFloat(p.salePrice as any),
      purchasePrice: parseFloat(p.purchasePrice as any),
    }));
    return z.array(productDefSchema).parse(formatted);
  } catch (error) {
    console.error('fetchProducts error:', error);
    return [];
  }
}

export async function fetchSelectorData(): Promise<{ devices: DeviceDef[]; providers: ProviderDef[] }> {
  try {
    const devicesList = await deviceRepository.getAllDevices();
    const providersList = await providerRepository.getAllProviders();

    return {
      devices: z.array(deviceDefSchema).parse(devicesList),
      providers: z.array(providerDefSchema).parse(providersList),
    };
  } catch (error) {
    console.error('fetchSelectorData error:', error);
    return { devices: [], providers: [] };
  }
}

export async function createProductAction(input: ProductInput): Promise<ActionResult<ProductDef>> {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const newProduct = await productRepository.createProduct(parsed.data, tx);

      await recordAuditLog(caller.id, 'CREAR', 'PRODUCT', newProduct.id, {
        deviceId: parsed.data.deviceId,
        stock: parsed.data.stock,
        purchasePrice: parsed.data.purchasePrice,
        salePrice: parsed.data.salePrice,
      }, tx);

      return { 
        success: true, 
        message: MESSAGES.SUCCESS.CREATED('Producto'),
        data: newProduct as ProductDef
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'producto') };
  }
}

export async function updateProductAction(id: string, input: ProductUpdateInput): Promise<ActionResult<ProductDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = productUpdateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const updated = await productRepository.updateProduct(id, parsed.data, tx);

      await recordAuditLog(caller.id, 'ACTUALIZAR', 'PRODUCT', id, parsed.data, tx);

      return { 
        success: true, 
        message: MESSAGES.SUCCESS.UPDATED('Producto'),
        data: updated as ProductDef
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'producto') };
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      // Rule: Cannot delete if has sales or losses (Business check before DB constraint)
      const hasRelations = await productRepository.checkHasRelations(id, tx);
      if (hasRelations) {
        return { success: false, error: MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION };
      }

      await productRepository.deleteProduct(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'PRODUCT', id, undefined, tx);

      return { success: true, message: MESSAGES.SUCCESS.DELETED('Producto') };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'producto') };
  }
}

export async function registerProductLossAction(productId: string, quantity: number, reason: string): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    if (quantity <= 0) return { success: false, error: 'La cantidad debe ser mayor a 0' };
    if (!reason.trim()) return { success: false, error: 'Debe especificar un motivo' };

    return await db.transaction(async (tx) => {
      await productRepository.registerLoss(productId, caller.id, quantity, reason, tx);

      await recordAuditLog(caller.id, 'PÉRDIDA', 'PRODUCT', productId, { quantity, reason }, tx);

      return { success: true, message: 'Pérdida registrada exitosamente' };
    });
  } catch (error: any) {
    console.error('Error in registerProductLossAction:', error);
    return { success: false, error: handleDatabaseError(error, 'producto') };
  }
}

export async function fetchLandingProducts(): Promise<ProductDef[]> {
  try {
    const products = await productRepository.getLandingProducts();
    const formatted = products.map((p) => ({
      ...p,
      salePrice: parseFloat(p.salePrice as any),
      purchasePrice: parseFloat(p.purchasePrice as any),
    }));
    return z.array(productDefSchema).parse(formatted);
  } catch (error) {
    console.error('fetchLandingProducts error:', error);
    return [];
  }
}

export async function toggleProductVisibilityAction(id: string, isVisible: boolean): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    
    return await db.transaction(async (tx) => {
      await productRepository.toggleVisibility(id, isVisible, tx);

      await recordAuditLog(caller.id, 'ACTUALIZAR_VISIBILIDAD_LANDING', 'PRODUCT', id, { showOnLanding: isVisible }, tx);

      return { 
        success: true, 
        message: isVisible ? 'Producto visible en landing page' : 'Producto oculto en landing page' 
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'producto') };
  }
}

export async function fetchProductById(id: string): Promise<ProductDef | null> {
  try {
    const product = await productRepository.getProductById(id);
    if (!product) return null;
    
    const formatted = {
      ...product,
      salePrice: parseFloat(product.salePrice as any),
      purchasePrice: parseFloat(product.purchasePrice as any),
    };
    
    return productDefSchema.parse(formatted);
  } catch (error) {
    console.error('fetchProductById error:', error);
    return null;
  }
}

