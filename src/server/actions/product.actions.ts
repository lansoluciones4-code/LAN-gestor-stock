'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { productRepository } from '@/server/repositories/product.repository';
import { deviceRepository } from '@/server/repositories/device.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { productSchema, productDefSchema, ProductInput, type ProductDef } from '@/schemas/product.schema';
import { providerDefSchema, type ProviderDef } from '@/schemas/provider.schema';
import { deviceDefSchema, type DeviceDef } from '@/schemas/device.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

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
    const devicesList = await deviceRepository.getAllDevices(true);
    const providersList = await providerRepository.getAllProviders(true);

    return {
      devices: z.array(deviceDefSchema).parse(devicesList),
      providers: z.array(providerDefSchema).parse(providersList),
    };
  } catch (error) {
    console.error('fetchSelectorData error:', error);
    return { devices: [], providers: [] };
  }
}

export async function createProductAction(input: ProductInput) {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    return await db.transaction(async (tx) => {
      const newProduct = await productRepository.createProduct(parsed.data, tx);

      await recordAuditLog(caller.id, 'CREAR', 'PRODUCT', newProduct.id, {
        deviceId: parsed.data.deviceId,
        stock: parsed.data.stock,
        purchasePrice: parsed.data.purchasePrice,
        salePrice: parsed.data.salePrice,
      }, tx);

      return { success: true, message: 'Producto registrado exitosamente' };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al guardar producto' };
  }
}

export async function updateProductAction(id: string, input: ProductInput) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    return await db.transaction(async (tx) => {
      await productRepository.updateProduct(id, parsed.data, tx);

      await recordAuditLog(caller.id, 'ACTUALIZAR', 'PRODUCT', id, {
        deviceId: parsed.data.deviceId,
        stock: parsed.data.stock,
        salePrice: parsed.data.salePrice,
      }, tx);

      return { success: true, message: 'Producto actualizado exitosamente' };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar producto' };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      // Rule: Cannot delete if has sales or losses
      const hasRelations = await productRepository.checkHasRelations(id, tx);
      if (hasRelations) {
        throw new Error('No se puede eliminar: este producto ya ha sido parte de una venta o tiene pérdidas registradas.');
      }

      await productRepository.deleteProduct(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'PRODUCT', id, undefined, tx);

      return { success: true, message: 'Producto eliminado exitosamente' };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al eliminar producto' };
  }
}

export async function registerProductLossAction(productId: string, quantity: number, reason: string) {
  try {
    const caller = await verifyAuthOrAdmin(true);

    if (quantity <= 0) return { success: false, message: 'La cantidad debe ser mayor a 0' };
    if (!reason.trim()) return { success: false, message: 'Debe especificar un motivo' };

    return await db.transaction(async (tx) => {
      await productRepository.registerLoss(productId, caller.id, quantity, reason, tx);

      await recordAuditLog(caller.id, 'PÉRDIDA', 'PRODUCT', productId, { quantity, reason }, tx);

      return { success: true, message: 'Pérdida registrada exitosamente' };
    });
  } catch (error: any) {
    console.error('Error in registerProductLossAction:', error);
    return { success: false, message: error.message || 'No se pudo completar la operación.' };
  }
}
