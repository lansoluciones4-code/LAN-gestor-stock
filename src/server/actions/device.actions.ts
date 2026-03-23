'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { deviceRepository } from '@/server/repositories/device.repository';
import { deviceSchema, DeviceInput } from '@/schemas/device.schema';
import { verifyToken } from '@/lib/auth/jwt';

async function checkAdminAccess() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) throw new Error('No autorizado (Token faltante)');
  
  const user = await verifyToken(token);
  if (user.role !== 'admin') {
    throw new Error('Solo los administradores pueden realizar esta acción');
  }
}

export async function fetchDevices(search?: string) {
  try {
    return await deviceRepository.getAllDevices(search);
  } catch (error) {
    console.error('fetchDevices error:', error);
    return [];
  }
}

export async function createDeviceAction(input: DeviceInput) {
  try {
    await checkAdminAccess();
    const parsed = deviceSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await deviceRepository.createDevice(parsed.data);
    revalidatePath('/equipos');
    return { success: true, message: 'Equipo creado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al crear equipo' };
  }
}

export async function updateDeviceAction(id: string, input: DeviceInput) {
  try {
    await checkAdminAccess();
    const parsed = deviceSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await deviceRepository.updateDevice(id, parsed.data);
    revalidatePath('/equipos');
    return { success: true, message: 'Equipo actualizado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar equipo' };
  }
}

export async function deleteDeviceAction(id: string) {
  try {
    await checkAdminAccess();
    await deviceRepository.deleteDevice(id);
    revalidatePath('/equipos');
    return { success: true, message: 'Equipo eliminado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al eliminar equipo' };
  }
}
