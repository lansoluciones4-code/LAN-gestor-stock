'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { providerRepository } from '@/features/provider/repository/provider.repository';
import { providerCreateSchema, providerRowSchema, ProviderInput, type ProviderDef, providerUpdateSchema, type ProviderUpdateInput } from '@/features/provider/domain/provider.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';
import { ConcurrencyError } from '@/lib/errors';

import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';

export async function fetchProviders(): Promise<ProviderDef[]> {
  try {
    await verifyAuthOrAdmin(false); // Vendors can see providers
    const providersList = await providerRepository.getAllProviders();
    return z.array(providerRowSchema).parse(providersList);
  } catch (error) {
    console.error('fetchProviders error:', error);
    return [];
  }
}

export async function toggleProviderActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      const provider = await tx.query.providers.findFirst({ where: (p: any, { eq }: any) => eq(p.id, id) });
      await providerRepository.updateActiveStatus(id, isActive, tx);
      await recordAuditLog(caller.id, isActive ? 'ACTUALIZAR' : 'ELIMINAR', 'PROVIDER', id, {
        name: provider?.name ?? 'Desconocido',
        active: isActive,
        action: isActive ? 'Reactivado' : 'Desactivado',
      }, tx);
      return {
        success: true,
        message: isActive ? MESSAGES.SUCCESS.ACTIVATED('Proveedor') : MESSAGES.SUCCESS.DEACTIVATED('Proveedor'),
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Proveedor') };
  }
}

export async function createProviderAction(input: ProviderInput): Promise<ActionResult<ProviderDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = providerCreateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const result = await providerRepository.createProvider(parsed.data, tx);
      const wasReactivated = (result as any).wasInactive;

      await recordAuditLog(
        caller.id,
        'CREAR',
        'PROVIDER',
        result.id,
        {
          name: result.name,
          note: wasReactivated ? 'Proveedor reactivado' : 'Nuevo registro',
        },
        tx
      );

      return {
        success: true,
        message: wasReactivated ? MESSAGES.SUCCESS.REACTIVATED('Proveedor') : MESSAGES.SUCCESS.CREATED('Proveedor'),
        data: result as ProviderDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Proveedor') };
  }
}

export async function updateProviderAction(id: string, input: ProviderUpdateInput): Promise<ActionResult<ProviderDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = providerUpdateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const updated = await providerRepository.updateProvider(id, parsed.data, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'PROVIDER', id, {
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
      }, tx);
      return {
        success: true,
        message: MESSAGES.SUCCESS.UPDATED('Proveedor'),
        data: updated as ProviderDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Proveedor') };
  }
}

export async function deleteProviderAction(id: string): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      // Check relations (business logic check before DB constraint)
      const hasProducts = await providerRepository.checkHasRelations(id, tx);
      if (hasProducts) {
        return { success: false, error: MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION };
      }

      const provider = await tx.query.providers.findFirst({ where: (p: any, { eq }: any) => eq(p.id, id) });
      await providerRepository.deleteProvider(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'PROVIDER', id, {
        name: provider?.name ?? 'Desconocido',
        phone: provider?.phone ?? '',
        email: provider?.email ?? '',
        note: 'Eliminación permanente',
      }, tx);
      return { success: true, message: MESSAGES.SUCCESS.DELETED('Proveedor') };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Proveedor') };
  }
}
