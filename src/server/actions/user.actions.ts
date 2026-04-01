'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { userRepository } from '@/server/repositories/user.repository';
import { userSchema, userDefSchema, UserInput, type UserDef } from '@/schemas/user.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

export async function fetchUsers(includeInactive = false): Promise<UserDef[]> {
  try {
    await verifyAuthOrAdmin(true);
    const usersList = await userRepository.getAllUsers(includeInactive);
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
    await userRepository.updateActiveStatus(id, isActive);

    await recordAuditLog(caller.id, isActive ? 'ACTUALIZAR' : 'ELIMINAR', 'USER', id, { active: isActive });

    return { success: true, message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al cambiar estado del usuario' };
  }
}

export async function createUserAction(input: UserInput) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = userSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    const newUser = await userRepository.createUser(parsed.data);

    await recordAuditLog(caller.id, 'CREAR', 'USER', newUser.id, { username: newUser.username, role: newUser.role });

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

    await recordAuditLog(caller.id, 'ACTUALIZAR', 'USER', id, { username: input.username, role: input.role });

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

    // Check relations (audit logs)
    const hasRelations = await userRepository.checkHasRelations(id);
    if (hasRelations) {
      return {
        success: false,
        message: 'No se puede eliminar permanentemente: este usuario tiene registros de auditoría asociados. Prueba desactivarlo.',
      };
    }

    await userRepository.deleteUser(id);

    await recordAuditLog(caller.id, 'ELIMINAR', 'USER', id, { note: 'Eliminación permanente' });

    return { success: true, message: 'Usuario eliminado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al eliminar usuario' };
  }
}
