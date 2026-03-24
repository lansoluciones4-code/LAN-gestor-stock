'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { providerRepository } from '@/server/repositories/provider.repository';
import { providerSchema, providerDefSchema, ProviderInput, type ProviderDef } from '@/schemas/provider.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

export async function fetchProviders(): Promise<ProviderDef[]> {
  try {
    await verifyAuthOrAdmin(false); // Vendors can see providers
    const providersList = await providerRepository.getAllProviders();
    return z.array(providerDefSchema).parse(providersList);
  } catch (error) {
    console.error('fetchProviders error:', error);
    return [];
  }
}

export async function createProviderAction(input: ProviderInput) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = providerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    const newProvider = await providerRepository.createProvider(parsed.data);
    revalidatePath('/proveedores');

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
    await providerRepository.deleteProvider(id);
    revalidatePath('/proveedores');

    await recordAuditLog(
      caller.id,
      'DELETE',
      'PROVIDER',
      id
    );

    return { success: true, message: 'Proveedor eliminado exitosamente' };
  } catch (error: any) {
    // This could fail if there are products linked via Foreign Key Constraints
    return { success: false, message: 'Error al eliminar proveedor. Verifica que no tenga productos asociados.' };
  }
}
