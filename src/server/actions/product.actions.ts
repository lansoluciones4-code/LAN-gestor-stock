'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { productRepository } from '@/server/repositories/product.repository';
import { deviceRepository } from '@/server/repositories/device.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { productSchema, ProductInput } from '@/schemas/product.schema';
import { verifyToken } from '@/lib/auth/jwt';

async function verifyAuthOrAdmin(requireAdmin = false) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) throw new Error('No autorizado (Token faltante)');
  
  const user = await verifyToken(token);
  if (requireAdmin && user.role !== 'admin') {
    throw new Error('Solo los administradores pueden realizar esta acción');
  }
  return user;
}

export async function fetchProducts(search?: string) {
  try {
    const products = await productRepository.getAllProducts(search);
    return products.map(p => ({
      ...p,
      salePrice: parseFloat(p.salePrice as any),
      purchasePrice: parseFloat(p.purchasePrice as any)
    }));
  } catch (error) {
    console.error('fetchProducts error:', error);
    return [];
  }
}

export async function fetchSelectorData() {
  const devices = await deviceRepository.getAllDevices();
  const providers = await providerRepository.getAllProviders();
  return { devices, providers };
}

export async function createProductAction(input: ProductInput) {
  try {
    await verifyAuthOrAdmin(true);
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await productRepository.createProduct(parsed.data);
    revalidatePath('/productos');
    return { success: true, message: 'Producto registrado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al guardar producto' };
  }
}

export async function updateProductAction(id: string, input: ProductInput) {
  try {
    await verifyAuthOrAdmin(true);
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await productRepository.updateProduct(id, parsed.data);
    revalidatePath('/productos');
    return { success: true, message: 'Producto actualizado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar producto' };
  }
}

export async function deleteProductAction(id: string) {
  try {
    await verifyAuthOrAdmin(true);
    await productRepository.deleteProduct(id);
    revalidatePath('/productos');
    return { success: true, message: 'Producto eliminado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al eliminar producto' };
  }
}
