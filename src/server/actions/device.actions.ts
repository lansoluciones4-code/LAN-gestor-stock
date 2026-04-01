'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { deviceRepository } from '@/server/repositories/device.repository';
import { deviceSchema, deviceDefSchema, DeviceInput, type DeviceDef } from '@/schemas/device.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

export async function fetchDevices(includeInactive = true, search?: string): Promise<DeviceDef[]> {
  try {
    await verifyAuthOrAdmin(false);
    const devicesList = await deviceRepository.getAllDevices(includeInactive, search);
    return z.array(deviceDefSchema).parse(devicesList);
  } catch (error) {
    console.error('fetchDevices error:', error);
    return [];
  }
}

export async function toggleDeviceActiveAction(id: string, isActive: boolean) {
  try {
    console.log(`[DeviceAction] Iniciando cambio de estado de equipo a ${isActive ? 'activo' : 'inactivo'} (ID: ${id})...`);
    const caller = await verifyAuthOrAdmin(true);
    await deviceRepository.updateActiveStatus(id, isActive);

    await recordAuditLog(caller.id, isActive ? 'ACTUALIZAR' : 'ELIMINAR', 'DEVICE', id, { active: isActive });

    return { success: true, message: `Equipo ${isActive ? 'activado' : 'desactivado'} exitosamente` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al cambiar estado del equipo' };
  }
}

export async function createDeviceAction(input: DeviceInput) {
  try {
    console.log(`[DeviceAction] Iniciando creación de nuevo equipo (${input.name})...`);
    const caller = await verifyAuthOrAdmin(true);
    const parsed = deviceSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    const newDevice = await deviceRepository.createDevice(parsed.data);

    await recordAuditLog(caller.id, 'CREAR', 'DEVICE', newDevice.id, { name: newDevice.name });

    return { success: true, message: 'Equipo creado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al crear equipo' };
  }
}

export async function updateDeviceAction(id: string, input: DeviceInput) {
  try {
    console.log(`[DeviceAction] Iniciando actualización de equipo (ID: ${id})...`);
    const caller = await verifyAuthOrAdmin(true);
    const parsed = deviceSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await deviceRepository.updateDevice(id, parsed.data);

    await recordAuditLog(caller.id, 'ACTUALIZAR', 'DEVICE', id, { name: input.name });

    return { success: true, message: 'Equipo actualizado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar equipo' };
  }
}

export async function deleteDeviceAction(id: string) {
  try {
    console.log(`[DeviceAction] Iniciando eliminación de equipo (ID: ${id})...`);
    const caller = await verifyAuthOrAdmin(true);

    // Rule: Cannot delete if has products
    const hasProducts = await deviceRepository.checkHasRelations(id);
    if (hasProducts) {
      console.log(`[DeviceAction] Eliminación rechazada: el equipo (ID: ${id}) tiene productos asociados.`);
      return {
        success: false,
        message: 'No se puede eliminar permanentemente: este equipo tiene productos asociados en el stock. Prueba desactivarlo.',
      };
    }

    await deviceRepository.deleteDevice(id);

    await recordAuditLog(caller.id, 'ELIMINAR', 'DEVICE', id, { note: 'Eliminación permanente' });

    console.log(`[DeviceAction] Equipo (ID: ${id}) eliminado exitosamente.`);
    return { success: true, message: 'Equipo eliminado permanentemente' };
  } catch (error: any) {
    console.error('[DeviceAction] Error al eliminar equipo:', error);

    // Parse PostgreSQL FK Error just in case
    const errorMsg = error.message?.toLowerCase() || '';
    if (errorMsg.includes('23503') || errorMsg.includes('foreign key constraint') || errorMsg.includes('violates foreign key')) {
      return { success: false, message: 'No se puede eliminar el equipo porque tiene registros vinculados (ej. historial o stock). Por favor, inactívalo.' };
    }

    return { success: false, message: error.message || 'Error al eliminar equipo' };
  }
}
