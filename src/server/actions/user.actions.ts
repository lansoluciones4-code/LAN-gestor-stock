'use server';

import { z } from 'zod';
import { userRepository } from '@/server/repositories/user.repository';
import { userSchema, userDefSchema, UserInput, type UserDef } from '@/schemas/user.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

import { db } from '@/lib/db';

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

export async function toggleUserActiveAction(id: string, isActive: boolean) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    if (caller.id === id) {
      return { success: false, message: 'No puedes cambiar tu propio estado de actividad.' };
    }

    return await db.transaction(async (tx) => {
      await userRepository.updateActiveStatus(id, isActive, tx);
      await recordAuditLog(caller.id, isActive ? 'ACTUALIZAR' : 'ELIMINAR', 'USER', id, { active: isActive }, tx);
      return { success: true, message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente` };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al cambiar estado del usuario' };
  }
}

export async function createUserAction(input: UserInput) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = userSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    return await db.transaction(async (tx) => {
      const result = await userRepository.createUser(parsed.data, tx);

      await recordAuditLog(caller.id, 'CREAR', 'USER', result.id, {
        username: result.username,
        role: result.role,
        note: (result as any).wasInactive ? 'Usuario reactivado' : 'Nuevo registro',
      }, tx);

      return {
        success: true,
        message: (result as any).wasInactive
          ? 'El usuario ya existía (inactivo) y ha sido reactivado con los nuevos datos'
          : 'Usuario registrado exitosamente',
      };
    });
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

    return await db.transaction(async (tx) => {
      await userRepository.updateUser(id, parsed.data, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'USER', id, { username: input.username, role: input.role }, tx);
      return { success: true, message: 'Usuario actualizado exitosamente' };
    });
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

    return await db.transaction(async (tx) => {
      const user = await userRepository.getUserById(id, tx);
      if (!user) throw new Error('Usuario no encontrado');

      // Rule 1: Only inactive users can be deleted
      if (user.isActive) {
        throw new Error('Primero debes desactivar al usuario para poder eliminarlo.');
      }

      // Rule 2: Cannot delete users with history (logs)
      const hasLogs = await userRepository.checkHasRelations(id, tx);
      if (hasLogs) {
        throw new Error(
          'No se puede eliminar de la base de datos a un usuario que posee historial de registros asociados. ' +
            'Este usuario ya forma parte de la historia del sistema. ' +
            'Simplemente mantenlo desactivado.'
        );
      }

      await userRepository.deleteUser(id, tx);
      
      await recordAuditLog(caller.id, 'ELIMINAR', 'USER', id, { note: 'Usuario eliminado permanentemente (sin historial previo).' }, tx);
      
      return { success: true, message: 'Usuario eliminado permanentemente de la base de datos.' };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al eliminar usuario' };
  }
}
