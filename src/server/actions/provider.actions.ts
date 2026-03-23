'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { providerRepository } from '@/server/repositories/provider.repository';
import { providerSchema, ProviderInput } from '@/schemas/provider.schema';
import { verifyToken } from '@/lib/auth/jwt';

async function verifyAuthOrAdmin(requireAdmin = true) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) throw new Error('No autorizado (Token faltante)');
  
  const user = await verifyToken(token);
  if (requireAdmin && user.role !== 'admin') {
    throw new Error('Solo los administradores pueden realizar esta acción');
  }
  return user;
}

export async function fetchProviders() {
  try {
    await verifyAuthOrAdmin(false); // Vendors can see providers
    const providers = await providerRepository.getAllProviders();
    return providers;
  } catch (error) {
    console.error('fetchProviders error:', error);
    return [];
  }
}

export async function createProviderAction(input: ProviderInput) {
  try {
    await verifyAuthOrAdmin(true);
    const parsed = providerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await providerRepository.createProvider(parsed.data);
    revalidatePath('/proveedores');
    return { success: true, message: 'Proveedor registrado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al guardar proveedor' };
  }
}

export async function updateProviderAction(id: string, input: ProviderInput) {
  try {
    await verifyAuthOrAdmin(true);
    const parsed = providerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await providerRepository.updateProvider(id, parsed.data);
    revalidatePath('/proveedores');
    return { success: true, message: 'Proveedor actualizado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar proveedor' };
  }
}

export async function deleteProviderAction(id: string) {
  try {
    await verifyAuthOrAdmin(true);
    await providerRepository.deleteProvider(id);
    revalidatePath('/proveedores');
    return { success: true, message: 'Proveedor eliminado exitosamente' };
  } catch (error: any) {
    // This could fail if there are products linked via Foreign Key Constraints
    return { success: false, message: 'Error al eliminar proveedor. Verifica que no tenga productos asociados.' };
  }
}
