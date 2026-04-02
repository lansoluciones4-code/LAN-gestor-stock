'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { deviceRepository } from '@/server/repositories/device.repository';
import { deviceSchema, deviceDefSchema, DeviceInput, type DeviceDef } from '@/schemas/device.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

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

export async function toggleDeviceActiveAction(id: string, isActive: boolean) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    
    return await db.transaction(async (tx) => {
      await deviceRepository.updateActiveStatus(id, isActive, tx);
      await recordAuditLog(caller.id, isActive ? 'ACTUALIZAR' : 'ELIMINAR', 'DEVICE', id, { active: isActive }, tx);
      return { success: true, message: `Equipo ${isActive ? 'activado' : 'desactivado'} exitosamente` };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al cambiar estado del equipo' };
  }
}

export async function createDeviceAction(input: DeviceInput): Promise<{ success: true; message: string } | { success: false; message: string }> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = deviceSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    return await db.transaction(async (tx) => {
      const result = await deviceRepository.createDevice(parsed.data, tx);
      const wasInactive = (result as any).wasInactive;

      await recordAuditLog(caller.id, 'CREAR', 'DEVICE', result.id, { 
        name: result.name,
        note: wasInactive ? 'Equipo reactivado' : 'Nuevo registro' 
      }, tx);

      return { 
        success: true, 
        message: wasInactive ? 'El equipo ya existía (inactivo) y ha sido reactivado' : 'Equipo creado exitosamente' 
      };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al crear equipo' };
  }
}

export async function updateDeviceAction(id: string, input: DeviceInput) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = deviceSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    return await db.transaction(async (tx) => {
      await deviceRepository.updateDevice(id, parsed.data, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'DEVICE', id, { name: input.name }, tx);
      return { success: true, message: 'Equipo actualizado exitosamente' };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar equipo' };
  }
}

export async function deleteDeviceAction(id: string) {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      // Check relations
      const hasProducts = await deviceRepository.checkHasRelations(id, tx);
      if (hasProducts) {
        throw new Error('No se puede eliminar permanentemente: este equipo tiene productos asociados en el stock. Prueba desactivarlo.');
      }

      await deviceRepository.deleteDevice(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'DEVICE', id, { note: 'Eliminación permanente' }, tx);
      return { success: true, message: 'Equipo eliminado permanentemente' };
    });
  } catch (error: any) {
    console.error('[DeviceAction] Error al eliminar equipo:', error);

    // Parse PostgreSQL FK Error
    const errorMsg = error.message?.toLowerCase() || '';
    if (errorMsg.includes('23503') || errorMsg.includes('foreign key constraint') || errorMsg.includes('violates foreign key')) {
      return { success: false, message: 'No se puede eliminar el equipo porque tiene registros vinculados. Por favor, inactívalo.' };
    }

    return { success: false, message: error.message || 'Error al eliminar equipo' };
  }
}
