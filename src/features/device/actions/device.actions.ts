'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { deviceRepository } from '@/features/device/repository/device.repository';
import { deviceCreateSchema, deviceRowSchema, DeviceInput, type DeviceDef, deviceUpdateSchema, type DeviceUpdateInput } from '@/features/device/domain/device.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';
import { ConcurrencyError } from '@/lib/errors';

import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';

export async function fetchDevices(): Promise<DeviceDef[]> {
  try {
    await verifyAuthOrAdmin(false);
    const devicesList = await deviceRepository.getAllDevices();
    return z.array(deviceRowSchema).parse(devicesList);
  } catch (error) {
    console.error('fetchDevices error:', error);
    return [];
  }
}

export type DeviceFieldOption = { value: string; hasProducts: boolean };

export async function fetchDeviceFieldOptions(field: 'category' | 'brand', section: 'tech' | 'libreria'): Promise<DeviceFieldOption[]> {
  try {
    await verifyAuthOrAdmin(false);
    return await deviceRepository.getFieldOptions(field, section);
  } catch (error) {
    console.error('fetchDeviceFieldOptions error:', error);
    return [];
  }
}

export async function deleteDeviceFieldOptionAction(field: 'category' | 'brand', value: string, section: 'tech' | 'libreria'): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    await deviceRepository.clearFieldOption(field, value, section);
    await recordAuditLog(caller.id, 'ELIMINAR', field === 'category' ? 'DEVICE_CATEGORY' : 'DEVICE_BRAND', undefined, { value, section });
    return { success: true, message: `"${value}" eliminado de las sugerencias.` };
  } catch (error: any) {
    return { success: false, error: error?.message || 'No se pudo eliminar.' };
  }
}

export async function renameDeviceFieldOptionAction(field: 'category' | 'brand', oldValue: string, newValue: string, section: 'tech' | 'libreria'): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const trimmed = newValue.trim();
    if (!trimmed) return { success: false, error: 'El nuevo nombre no puede estar vacío.' };
    if (trimmed === oldValue) return { success: true, message: 'Sin cambios.' };

    return await db.transaction(async (tx) => {
      const affectedCount = await deviceRepository.renameFieldOption(field, oldValue, trimmed, section, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', field === 'category' ? 'DEVICE_CATEGORY' : 'DEVICE_BRAND', undefined, { oldValue, newValue: trimmed, section, affectedCount }, tx);
      return { success: true, message: `Se renombró "${oldValue}" a "${trimmed}" en ${affectedCount} equipo(s).` };
    });
  } catch (error: any) {
    return { success: false, error: error?.message || 'No se pudo renombrar.' };
  }
}

export async function toggleDeviceActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      const device = await deviceRepository.getDeviceById(id);
      await deviceRepository.updateActiveStatus(id, isActive, tx);
      await recordAuditLog(caller.id, isActive ? 'ACTUALIZAR' : 'ELIMINAR', 'DEVICE', id, {
        name: device?.name ?? 'Desconocido',
        active: isActive,
        action: isActive ? 'Reactivado' : 'Desactivado',
      }, tx);
      return {
        success: true,
        message: isActive ? MESSAGES.SUCCESS.ACTIVATED('Equipo') : MESSAGES.SUCCESS.DEACTIVATED('Equipo'),
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Equipo') };
  }
}

export async function createDeviceAction(input: DeviceInput): Promise<ActionResult<DeviceDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = deviceCreateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const result = await deviceRepository.createDevice(parsed.data, tx);
      const wasReactivated = (result as any).wasInactive;

      await recordAuditLog(
        caller.id,
        'CREAR',
        'DEVICE',
        result.id,
        {
          name: result.name,
          category: result.category,
          brand: result.brand,
          section: result.section,
          note: wasReactivated ? 'Equipo reactivado' : 'Nuevo registro',
        },
        tx
      );

      return {
        success: true,
        message: wasReactivated ? MESSAGES.SUCCESS.REACTIVATED('Equipo') : MESSAGES.SUCCESS.CREATED('Equipo'),
        data: result as DeviceDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Equipo') };
  }
}

export async function updateDeviceAction(id: string, input: DeviceUpdateInput): Promise<ActionResult<DeviceDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = deviceUpdateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const updated = await deviceRepository.updateDevice(id, parsed.data, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'DEVICE', id, {
        name: updated.name,
      }, tx);
      return {
        success: true,
        message: MESSAGES.SUCCESS.UPDATED('Equipo'),
        data: updated as DeviceDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Equipo') };
  }
}

export async function deleteDeviceAction(id: string): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      // Check relations (Business logic check before DB constraint)
      const hasProducts = await deviceRepository.checkHasRelations(id, tx);
      if (hasProducts) {
        return { success: false, error: MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION };
      }

      const device = await deviceRepository.getDeviceById(id);
      await deviceRepository.deleteDevice(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'DEVICE', id, {
        name: device?.name ?? 'Desconocido',
        note: 'Eliminación permanente',
      }, tx);
      return { success: true, message: MESSAGES.SUCCESS.DELETED('Equipo') };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Equipo') };
  }
}
