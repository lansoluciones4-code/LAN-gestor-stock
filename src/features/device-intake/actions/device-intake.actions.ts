'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { deviceIntakeRepository } from '@/features/device-intake/repository/device-intake.repository';
import {
  deviceIntakeCreateSchema,
  deviceIntakeUpdateSchema,
  deviceIntakeDiagnosisSchema,
  deviceIntakeRowSchema,
  deviceIntakeSpecsSchemas,
  type DeviceIntakeInput,
  type DeviceIntakeUpdateInput,
  type DeviceIntakeDiagnosisInput,
  type DeviceIntakeDef,
} from '@/features/device-intake/domain/device-intake.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';
import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';

export async function fetchDeviceIntakes(): Promise<DeviceIntakeDef[]> {
  try {
    await verifyAuthOrAdmin(false); // Admin y vendedor ven el historial completo
    const list = await deviceIntakeRepository.getAllDeviceIntakes();
    return z.array(deviceIntakeRowSchema).parse(list);
  } catch (error) {
    console.error('fetchDeviceIntakes error:', error);
    return [];
  }
}

export async function createDeviceIntakeAction(input: DeviceIntakeInput): Promise<ActionResult<DeviceIntakeDef>> {
  try {
    const caller = await verifyAuthOrAdmin(false); // Admin y vendedor pueden registrar una recepción
    const parsed = deviceIntakeCreateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const result = await deviceIntakeRepository.createDeviceIntake(parsed.data, tx);
      await recordAuditLog(
        caller.id,
        'CREAR',
        'RECEPCION_EQUIPO',
        result.id,
        { equipmentType: result.equipmentType, receivedByName: result.receivedByName },
        tx
      );
      const withRelations = await deviceIntakeRepository.getDeviceIntakeById(result.id, tx);
      return {
        success: true,
        message: MESSAGES.SUCCESS.CREATED('Recepción de equipo'),
        data: deviceIntakeRowSchema.parse(withRelations),
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Recepción de equipo') };
  }
}

export async function updateDeviceIntakeAction(id: string, input: DeviceIntakeUpdateInput): Promise<ActionResult<DeviceIntakeDef>> {
  try {
    const caller = await verifyAuthOrAdmin(false); // Admin y vendedor pueden editar
    const parsed = deviceIntakeUpdateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    const existing = await deviceIntakeRepository.getDeviceIntakeById(id);
    if (!existing) return { success: false, error: MESSAGES.ERROR.DATABASE.NOT_FOUND('recepción de equipo') };

    let validatedData = parsed.data;
    if (parsed.data.specs !== undefined) {
      // `equipmentType` no se puede cambiar en un update — validamos `specs` contra el schema del tipo ya guardado.
      const specsSchema = deviceIntakeSpecsSchemas[existing.equipmentType as keyof typeof deviceIntakeSpecsSchemas];
      const specsParsed = specsSchema.safeParse(parsed.data.specs);
      if (!specsParsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };
      validatedData = { ...parsed.data, specs: specsParsed.data };
    }

    return await db.transaction(async (tx) => {
      const updated = await deviceIntakeRepository.updateDeviceIntake(id, validatedData, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'RECEPCION_EQUIPO', id, { equipmentType: updated.equipmentType, receivedByName: updated.receivedByName }, tx);
      const withRelations = await deviceIntakeRepository.getDeviceIntakeById(id, tx);
      return {
        success: true,
        message: MESSAGES.SUCCESS.UPDATED('Recepción de equipo'),
        data: deviceIntakeRowSchema.parse(withRelations),
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Recepción de equipo') };
  }
}

export async function submitDeviceIntakeDiagnosisAction(id: string, input: DeviceIntakeDiagnosisInput): Promise<ActionResult<DeviceIntakeDef>> {
  try {
    const caller = await verifyAuthOrAdmin(false); // Admin y vendedor pueden dar el diagnóstico final
    const parsed = deviceIntakeDiagnosisSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const updated = await deviceIntakeRepository.submitDiagnosis(id, parsed.data, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'RECEPCION_EQUIPO', id, { note: 'Diagnóstico final cargado', diagnosisAuthorName: updated.diagnosisAuthorName }, tx);
      const withRelations = await deviceIntakeRepository.getDeviceIntakeById(id, tx);
      return {
        success: true,
        message: 'Diagnóstico final guardado exitosamente',
        data: deviceIntakeRowSchema.parse(withRelations),
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Recepción de equipo') };
  }
}

export async function toggleDeviceIntakeActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true); // Solo admin desactiva/reactiva

    return await db.transaction(async (tx) => {
      await deviceIntakeRepository.updateActiveStatus(id, isActive, tx);
      await recordAuditLog(caller.id, isActive ? 'ACTUALIZAR' : 'ELIMINAR', 'RECEPCION_EQUIPO', id, {
        action: isActive ? 'Reactivada' : 'Desactivada',
      }, tx);
      return {
        success: true,
        message: isActive ? MESSAGES.SUCCESS.ACTIVATED('Recepción de equipo') : MESSAGES.SUCCESS.DEACTIVATED('Recepción de equipo'),
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Recepción de equipo') };
  }
}

export async function deleteDeviceIntakeAction(id: string): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true); // Solo admin borra permanentemente

    return await db.transaction(async (tx) => {
      const existing = await deviceIntakeRepository.getDeviceIntakeById(id, tx);
      await deviceIntakeRepository.deleteDeviceIntake(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'RECEPCION_EQUIPO', id, {
        equipmentType: existing?.equipmentType ?? 'Desconocido',
        note: 'Eliminación permanente',
      }, tx);
      return { success: true, message: MESSAGES.SUCCESS.DELETED('Recepción de equipo') };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Recepción de equipo') };
  }
}
