'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { productRepository } from '@/features/product/repository/product.repository';
import { deviceRepository } from '@/features/device/repository/device.repository';
import { providerRepository } from '@/features/provider/repository/provider.repository';
import { productCreateSchema, productRowSchema, ProductInput, type ProductDef, productUpdateSchema, type ProductUpdateInput } from '@/features/product/domain/product.schema';
import { providerRowSchema, type ProviderDef } from '@/features/provider/domain/provider.schema';
import { deviceRowSchema, type DeviceDef } from '@/features/device/domain/device.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';
import { ConcurrencyError } from '@/lib/errors';

import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';

export async function fetchProducts(): Promise<ProductDef[]> {
  try {
    const products = await productRepository.getAllProducts();
    return z.array(productRowSchema).parse(products);
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
      devices: z.array(deviceRowSchema).parse(devicesList),
      providers: z.array(providerRowSchema).parse(providersList),
    };
  } catch (error) {
    console.error('fetchSelectorData error:', error);
    return { devices: [], providers: [] };
  }
}

export async function createProductAction(input: ProductInput): Promise<ActionResult<ProductDef>> {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const parsed = productCreateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const newProduct = await productRepository.createProduct(parsed.data, tx);

      const [device, provider] = await Promise.all([
        tx.query.devices.findFirst({ where: (d: any, { eq }: any) => eq(d.id, parsed.data.deviceId) }),
        tx.query.providers.findFirst({ where: (p: any, { eq }: any) => eq(p.id, parsed.data.providerId) }),
      ]);

      await recordAuditLog(
        caller.id,
        'CREAR',
        'PRODUCT',
        newProduct.id,
        {
          deviceName: device?.name ?? 'Desconocido',
          providerName: provider?.name ?? 'Desconocido',
          description: parsed.data.description,
          stock: parsed.data.stock,
          purchasePrice: String(parsed.data.purchasePrice),
          salePrice: String(parsed.data.salePrice),
          note: 'Producto creado',
        },
        tx
      );

      return {
        success: true,
        message: MESSAGES.SUCCESS.CREATED('Producto'),
        data: newProduct as ProductDef,
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

      const [device, provider] = await Promise.all([
        updated.deviceId ? tx.query.devices.findFirst({ where: (d: any, { eq }: any) => eq(d.id, updated.deviceId) }) : Promise.resolve(null),
        updated.providerId ? tx.query.providers.findFirst({ where: (p: any, { eq }: any) => eq(p.id, updated.providerId) }) : Promise.resolve(null),
      ]);

      await recordAuditLog(caller.id, 'ACTUALIZAR', 'PRODUCT', id, {
        deviceName: device?.name ?? 'Desconocido',
        providerName: provider?.name ?? 'Desconocido',
        description: updated.description,
        stock: updated.stock,
        purchasePrice: String(updated.purchasePrice),
        salePrice: String(updated.salePrice),
      }, tx);

      return {
        success: true,
        message: MESSAGES.SUCCESS.UPDATED('Producto'),
        data: updated as ProductDef,
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

      const product = await productRepository.getProductById(id);

      await productRepository.deleteProduct(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'PRODUCT', id, {
        deviceName: product?.device?.name ?? 'Desconocido',
        description: product?.description ?? '',
        stockAlMomento: product?.stock ?? 0,
        salePrice: String(product?.salePrice ?? 0),
        note: 'Eliminación permanente',
      }, tx);

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
      const product = await productRepository.getProductById(productId);
      const stockBefore = product?.stock ?? 0;

      await productRepository.registerLoss(productId, caller.id, quantity, reason, tx);

      await recordAuditLog(caller.id, 'PÉRDIDA', 'PRODUCT', productId, {
        productName: product?.device?.name ?? 'Desconocido',
        description: product?.description ?? '',
        quantity,
        reason,
        stockBefore,
        stockAfter: stockBefore - quantity,
      }, tx);

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
    return z.array(productRowSchema).parse(products);
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

      const product = await productRepository.getProductById(id);

      await recordAuditLog(caller.id, 'ACTUALIZAR_VISIBILIDAD_LANDING', 'PRODUCT', id, {
        productName: product?.device?.name ?? 'Desconocido',
        description: product?.description ?? '',
        showOnLanding: isVisible,
      }, tx);

      return {
        success: true,
        message: isVisible ? 'Producto visible en landing page' : 'Producto oculto en landing page',
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
    return productRowSchema.parse(product);
  } catch (error) {
    console.error('fetchProductById error:', error);
    return null;
  }
}


