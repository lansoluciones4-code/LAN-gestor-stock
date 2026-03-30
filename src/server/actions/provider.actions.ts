'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { providerRepository } from '@/server/repositories/provider.repository';
import { providerSchema, providerDefSchema, ProviderInput, type ProviderDef } from '@/schemas/provider.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

export async function fetchProviders(includeInactive = true): Promise<ProviderDef[]> {
  try {
    await verifyAuthOrAdmin(false); // Vendors can see providers
    const providersList = await providerRepository.getAllProviders(includeInactive);
    return z.array(providerDefSchema).parse(providersList);
  } catch (error) {
    console.error('fetchProviders error:', error);
    return [];
  }
}

export async function toggleProviderActiveAction(id: string, isActive: boolean) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    await providerRepository.updateActiveStatus(id, isActive);
    revalidatePath('/proveedores');

    await recordAuditLog(
      caller.id,
      isActive ? 'UPDATE' : 'DELETE',
      'PROVIDER',
      id,
      { active: isActive, note: isActive ? 'Proveedor reactivado' : 'Proveedor desactivado' }
    );

    return { success: true, message: `Proveedor ${isActive ? 'activado' : 'desactivado'} exitosamente` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al cambiar estado del proveedor' };
  }
}

export async function createProviderAction(input: ProviderInput) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = providerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    const newProvider = await providerRepository.createProvider(parsed.data);
    revalidatePath('/proveedores');
    revalidatePath('/productos');

    await recordAuditLog(
      caller.id,
      'CREATE',
      'PROVIDER',
      newProvider.id,
      { name: newProvider.name }
    );

    return { success: true, message: 'Proveedor registrado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al guardar proveedor' };
  }
}

export async function updateProviderAction(id: string, input: ProviderInput) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = providerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await providerRepository.updateProvider(id, parsed.data);
    revalidatePath('/proveedores');
    revalidatePath('/productos');

    await recordAuditLog(
      caller.id,
      'UPDATE',
      'PROVIDER',
      id,
      { name: input.name }
    );

    return { success: true, message: 'Proveedor actualizado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar proveedor' };
  }
}

export async function deleteProviderAction(id: string) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    
    // Rule: Cannot delete if has products
    const hasProducts = await providerRepository.checkHasRelations(id);
    if (hasProducts) {
      return { 
        success: false, 
        message: 'No se puede eliminar permanentemente: este proveedor tiene productos asociados. Prueba desactivarlo.' 
      };
    }

    await providerRepository.deleteProvider(id);
    revalidatePath('/proveedores');

    await recordAuditLog(
      caller.id,
      'DELETE',
      'PROVIDER',
      id,
      { note: 'Eliminación permanente' }
    );

    return { success: true, message: 'Proveedor eliminado permanentemente' };
  } catch (error: any) {
    return { success: false, message: 'Error al eliminar proveedor de la base de datos.' };
  }
}
