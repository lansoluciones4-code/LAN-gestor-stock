'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
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

export async function toggleProviderActiveAction(id: string, isActive: boolean) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    
    return await db.transaction(async (tx) => {
      await providerRepository.updateActiveStatus(id, isActive, tx);
      await recordAuditLog(caller.id, isActive ? 'ACTUALIZAR' : 'ELIMINAR', 'PROVIDER', id, { active: isActive }, tx);
      return { success: true, message: `Proveedor ${isActive ? 'activado' : 'desactivado'} exitosamente` };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al cambiar estado del proveedor' };
  }
}

export async function createProviderAction(input: ProviderInput) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = providerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    return await db.transaction(async (tx) => {
      const result = await providerRepository.createProvider(parsed.data, tx);
      const wasInactive = (result as any).wasInactive;

      await recordAuditLog(caller.id, 'CREAR', 'PROVIDER', result.id, { 
        name: result.name,
        note: wasInactive ? 'Proveedor reactivado' : 'Nuevo registro'
      }, tx);

      return { 
        success: true, 
        message: wasInactive ? 'El proveedor ya existía (inactivo) y ha sido reactivado' : 'Proveedor registrado exitosamente' 
      };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al guardar proveedor' };
  }
}

export async function updateProviderAction(id: string, input: ProviderInput) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = providerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    return await db.transaction(async (tx) => {
      await providerRepository.updateProvider(id, parsed.data, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'PROVIDER', id, { name: input.name }, tx);
      return { success: true, message: 'Proveedor actualizado exitosamente' };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar proveedor' };
  }
}

export async function deleteProviderAction(id: string) {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      // Check relations
      const hasProducts = await providerRepository.checkHasRelations(id, tx);
      if (hasProducts) {
        throw new Error('No se puede eliminar permanentemente: este proveedor tiene productos asociados. Prueba desactivarlo.');
      }

      await providerRepository.deleteProvider(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'PROVIDER', id, { note: 'Eliminación permanente' }, tx);
      return { success: true, message: 'Proveedor eliminado permanentemente' };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al eliminar proveedor de la base de datos.' };
  }
}
