'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { deviceRepository } from '@/features/device/repository/device.repository';
import { deviceSchema, deviceDefSchema, DeviceInput, type DeviceDef, deviceUpdateSchema, type DeviceUpdateInput } from '@/features/device/domain/device.schema';
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
    return z.array(deviceDefSchema).parse(devicesList);
  } catch (error) {
    console.error('fetchDevices error:', error);
    return [];
  }
}

export async function toggleDeviceActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      await deviceRepository.updateActiveStatus(id, isActive, tx);
      await recordAuditLog(caller.id, isActive ? 'ACTUALIZAR' : 'ELIMINAR', 'DEVICE', id, { active: isActive }, tx);
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
    const parsed = deviceSchema.safeParse(input);
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
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'DEVICE', id, parsed.data, tx);
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

      await deviceRepository.deleteDevice(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'DEVICE', id, { note: 'Eliminación permanente' }, tx);
      return { success: true, message: MESSAGES.SUCCESS.DELETED('Equipo') };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Equipo') };
  }
}

export async function fetchLandingCategories(): Promise<DeviceDef[]> {
  try {
    const devicesList = await deviceRepository.getAllDevices();
    // Only return active categories for the landing page
    const active = devicesList.filter((d) => d.isActive);
    return z.array(deviceDefSchema).parse(active);
  } catch (error) {
    console.error('fetchLandingCategories error:', error);
    return [];
  }
}
