'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { sparePartRepository } from '@/features/spare-part/repository/spare-part.repository';
import {
  sparePartCreateSchema,
  sparePartUpdateSchema,
  sparePartRowSchema,
  type SparePartInput,
  type SparePartUpdateInput,
  type SparePartDef,
} from '@/features/spare-part/domain/spare-part.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';
import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';

/** Panel de gestión (admin y vendedor): todos los repuestos, vendidos incluidos. */
export async function fetchSpareParts(): Promise<SparePartDef[]> {
  try {
    await verifyAuthOrAdmin(false);
    const list = await sparePartRepository.getAllSpareParts();
    return z.array(sparePartRowSchema).parse(list);
  } catch (error) {
    console.error('fetchSpareParts error:', error);
    return [];
  }
}

/** Ventas (admin y vendedor): solo los repuestos aún no vendidos, para el doble click. */
export async function fetchPendingSparePartsForSale() {
  try {
    await verifyAuthOrAdmin(false);
    return await sparePartRepository.getPendingSparePartsForSale();
  } catch (error) {
    console.error('fetchPendingSparePartsForSale error:', error);
    return [];
  }
}

/** Admin y vendedor pueden cargar un repuesto nuevo (igual que "ingresar stock" en Productos); editar/eliminar sigue siendo admin-only. */
export async function createSparePartAction(input: SparePartInput): Promise<ActionResult<SparePartDef>> {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const parsed = sparePartCreateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const result = await sparePartRepository.createSparePart(parsed.data, tx);
      await recordAuditLog(caller.id, 'CREAR', 'REPUESTO', result.id, { title: result.title, condition: result.condition, cost: result.cost }, tx);
      return {
        success: true,
        message: MESSAGES.SUCCESS.CREATED('Repuesto'),
        data: { ...result, customer: null, sold: false } as unknown as SparePartDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Repuesto') };
  }
}

export async function updateSparePartAction(id: string, input: SparePartUpdateInput): Promise<ActionResult<SparePartDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = sparePartUpdateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    if (await sparePartRepository.isSold(id)) {
      return { success: false, error: 'Este repuesto ya fue vendido y no se puede editar.' };
    }

    return await db.transaction(async (tx) => {
      const updated = await sparePartRepository.updateSparePart(id, parsed.data, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'REPUESTO', id, { title: updated.title, cost: updated.cost, profitPercentage: updated.profitPercentage }, tx);
      return {
        success: true,
        message: MESSAGES.SUCCESS.UPDATED('Repuesto'),
        data: { ...updated, customer: null, sold: false } as unknown as SparePartDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Repuesto') };
  }
}

export async function deleteSparePartAction(id: string): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    if (await sparePartRepository.isSold(id)) {
      return { success: false, error: 'Este repuesto ya fue vendido y no se puede eliminar.' };
    }

    return await db.transaction(async (tx) => {
      const existing = await tx.query.spareParts.findFirst({ where: (s: any, { eq }: any) => eq(s.id, id) });
      await sparePartRepository.deleteSparePart(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'REPUESTO', id, { title: existing?.title ?? 'Desconocido' }, tx);
      return { success: true, message: MESSAGES.SUCCESS.DELETED('Repuesto') };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Repuesto') };
  }
}
