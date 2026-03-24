'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { userRepository } from '@/server/repositories/user.repository';
import { userSchema, userDefSchema, UserInput, type UserDef } from '@/schemas/user.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

export async function fetchUsers(): Promise<UserDef[]> {
  try {
    await verifyAuthOrAdmin(true);
    const usersList = await userRepository.getAllUsers();
    return z.array(userDefSchema).parse(usersList);
  } catch (error) {
    console.error('fetchUsers error:', error);
    return [];
  }
}

export async function createUserAction(input: UserInput) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = userSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    const newUser = await userRepository.createUser(parsed.data);
    revalidatePath('/usuarios');

    await recordAuditLog(
      caller.id,
      'CREATE',
      'USER',
      newUser.id,
      { username: newUser.username, role: newUser.role }
    );

    return { success: true, message: 'Usuario registrado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al guardar usuario' };
  }
}

export async function updateUserAction(id: string, input: UserInput) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    // Prevent an admin from mistakenly removing their own admin rights
    if (caller.id === id && input.role !== 'admin') {
      return { success: false, message: 'No puedes revocar tus propios permisos de administrador.' };
    }

    const parsed = userSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await userRepository.updateUser(id, parsed.data);
    revalidatePath('/usuarios');

    await recordAuditLog(
      caller.id,
      'UPDATE',
      'USER',
      id,
      { username: input.username, role: input.role }
    );

    return { success: true, message: 'Usuario actualizado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar usuario' };
  }
}

export async function deleteUserAction(id: string) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    if (caller.id === id) {
      return { success: false, message: 'No puedes Auto-Inmolarte (Eliminar tu propia cuenta).' };
    }

    await userRepository.deleteUser(id);
    revalidatePath('/usuarios');

    await recordAuditLog(
      caller.id,
      'DELETE',
      'USER',
      id
    );

    return { success: true, message: 'Usuario eliminado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al eliminar usuario' };
  }
}
