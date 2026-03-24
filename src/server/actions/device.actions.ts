'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { deviceRepository } from '@/server/repositories/device.repository';
import { deviceSchema, deviceDefSchema, DeviceInput, type DeviceDef } from '@/schemas/device.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

export async function fetchDevices(includeInactive = false, search?: string): Promise<DeviceDef[]> {
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
    const caller = await verifyAuthOrAdmin(true);
    await deviceRepository.updateActiveStatus(id, isActive);
    revalidatePath('/equipos');

    await recordAuditLog(
      caller.id,
      isActive ? 'UPDATE' : 'DELETE',
      'DEVICE',
      id,
      { active: isActive }
    );

    return { success: true, message: `Equipo ${isActive ? 'activado' : 'desactivado'} exitosamente` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al cambiar estado del equipo' };
  }
}

export async function createDeviceAction(input: DeviceInput) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = deviceSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    const newDevice = await deviceRepository.createDevice(parsed.data);
    revalidatePath('/equipos');

    await recordAuditLog(
      caller.id,
      'CREATE',
      'DEVICE',
      newDevice.id,
      { name: newDevice.name }
    );

    return { success: true, message: 'Equipo creado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al crear equipo' };
  }
}

export async function updateDeviceAction(id: string, input: DeviceInput) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = deviceSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await deviceRepository.updateDevice(id, parsed.data);
    revalidatePath('/equipos');

    await recordAuditLog(
      caller.id,
      'UPDATE',
      'DEVICE',
      id,
      { name: input.name }
    );

    return { success: true, message: 'Equipo actualizado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar equipo' };
  }
}

export async function deleteDeviceAction(id: string) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    
    // Rule: Cannot delete if has products
    const hasProducts = await deviceRepository.checkHasRelations(id);
    if (hasProducts) {
      return { 
        success: false, 
        message: 'No se puede eliminar permanentemente: este equipo tiene productos asociados en el stock. Prueba desactivarlo.' 
      };
    }

    await deviceRepository.deleteDevice(id);
    revalidatePath('/equipos');

    await recordAuditLog(
      caller.id,
      'DELETE',
      'DEVICE',
      id,
      { note: 'Eliminación permanente' }
    );

    return { success: true, message: 'Equipo eliminado permanentemente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al eliminar equipo' };
  }
}
