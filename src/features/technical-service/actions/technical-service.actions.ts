'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { technicalServiceRepository } from '@/features/technical-service/repository/technical-service.repository';
import {
  technicalServiceCreateSchema,
  technicalServiceRowSchema,
  type TechnicalServiceInput,
  type TechnicalServiceDef,
  technicalServiceUpdateSchema,
  type TechnicalServiceUpdateInput,
} from '@/features/technical-service/domain/technical-service.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';

export async function fetchTechnicalServices(): Promise<TechnicalServiceDef[]> {
  try {
    // Lectura abierta a vendedores: necesitan ver el catálogo para poder venderlo desde Ventas.
    // Las mutaciones (crear/editar/borrar/activar) siguen siendo admin-only, sin cambios.
    await verifyAuthOrAdmin(false);
    const list = await technicalServiceRepository.getAllTechnicalServices();
    return z.array(technicalServiceRowSchema).parse(list);
  } catch (error) {
    console.error('fetchTechnicalServices error:', error);
    return [];
  }
}

export async function toggleTechnicalServiceActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      const service = await tx.query.technicalServices.findFirst({ where: (s: any, { eq }: any) => eq(s.id, id) });
      await technicalServiceRepository.updateActiveStatus(id, isActive, tx);
      await recordAuditLog(
        caller.id,
        isActive ? 'ACTUALIZAR' : 'ELIMINAR',
        'TECHNICAL_SERVICE',
        id,
        {
          name: service?.name ?? 'Desconocido',
          active: isActive,
          action: isActive ? 'Reactivado' : 'Desactivado',
        },
        tx
      );
      return {
        success: true,
        message: isActive ? MESSAGES.SUCCESS.ACTIVATED('Servicio técnico') : MESSAGES.SUCCESS.DEACTIVATED('Servicio técnico'),
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Servicio técnico') };
  }
}

export async function createTechnicalServiceAction(input: TechnicalServiceInput): Promise<ActionResult<TechnicalServiceDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = technicalServiceCreateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const result = await technicalServiceRepository.createTechnicalService(parsed.data, tx);
      const wasReactivated = (result as any).wasInactive;

      await recordAuditLog(
        caller.id,
        'CREAR',
        'TECHNICAL_SERVICE',
        result.id,
        {
          name: result.name,
          value: result.value,
          note: wasReactivated ? 'Servicio técnico reactivado' : 'Nuevo registro',
        },
        tx
      );

      return {
        success: true,
        message: wasReactivated ? MESSAGES.SUCCESS.REACTIVATED('servicio técnico') : MESSAGES.SUCCESS.CREATED('Servicio técnico'),
        data: result as unknown as TechnicalServiceDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Servicio técnico') };
  }
}

export async function updateTechnicalServiceAction(id: string, input: TechnicalServiceUpdateInput): Promise<ActionResult<TechnicalServiceDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = technicalServiceUpdateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const updated = await technicalServiceRepository.updateTechnicalService(id, parsed.data, tx);
      await recordAuditLog(
        caller.id,
        'ACTUALIZAR',
        'TECHNICAL_SERVICE',
        id,
        {
          name: updated.name,
          description: updated.description,
          value: updated.value,
        },
        tx
      );
      return {
        success: true,
        message: MESSAGES.SUCCESS.UPDATED('Servicio técnico'),
        data: updated as unknown as TechnicalServiceDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Servicio técnico') };
  }
}

export async function deleteTechnicalServiceAction(id: string): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      const hasRelations = await technicalServiceRepository.checkHasRelations(id, tx);
      if (hasRelations) {
        return { success: false, error: MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION };
      }

      const service = await tx.query.technicalServices.findFirst({ where: (s: any, { eq }: any) => eq(s.id, id) });
      await technicalServiceRepository.deleteTechnicalService(id, tx);
      await recordAuditLog(
        caller.id,
        'ELIMINAR',
        'TECHNICAL_SERVICE',
        id,
        {
          name: service?.name ?? 'Desconocido',
          value: service?.value ?? '',
          note: 'Eliminación permanente',
        },
        tx
      );
      return { success: true, message: MESSAGES.SUCCESS.DELETED('Servicio técnico') };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Servicio técnico') };
  }
}
