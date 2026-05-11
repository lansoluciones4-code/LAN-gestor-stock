'use server';

import { z } from 'zod';
import { userRepository } from '@/features/user/repository/user.repository';
import { userCreateSchema, userRowSchema, UserInput, type UserDef, userUpdateSchema, type UserUpdateInput } from '@/features/user/domain/user.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';
import { ConcurrencyError } from '@/lib/errors';

import { db } from '@/lib/db';

import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';

export async function fetchUsers(): Promise<UserDef[]> {
  try {
    await verifyAuthOrAdmin(true);
    const usersList = await userRepository.getAllUsers();
    return z.array(userRowSchema).parse(usersList);
  } catch (error) {
    console.error('fetchUsers error:', error);
    return [];
  }
}

export async function toggleUserActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    if (caller.id === id) {
      return { success: false, error: 'No puedes cambiar tu propio estado de actividad.' };
    }

    return await db.transaction(async (tx) => {
      const target = await userRepository.getUserById(id, tx);
      await userRepository.updateActiveStatus(id, isActive, tx);
      await recordAuditLog(caller.id, isActive ? 'ACTUALIZAR' : 'ELIMINAR', 'USER', id, {
        username: target?.username ?? 'Desconocido',
        role: target?.role ?? 'Desconocido',
        active: isActive,
        action: isActive ? 'Reactivado' : 'Desactivado',
      }, tx);
      return {
        success: true,
        message: isActive ? MESSAGES.SUCCESS.ACTIVATED('Usuario') : MESSAGES.SUCCESS.DEACTIVATED('Usuario'),
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Usuario') };
  }
}

export async function createUserAction(input: UserInput): Promise<ActionResult<UserDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = userCreateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const result = await userRepository.createUser(parsed.data, tx);
      const wasReactivated = (result as any).wasInactive;

      await recordAuditLog(
        caller.id,
        'CREAR',
        'USER',
        result.id,
        {
          username: result.username,
          role: result.role,
          note: wasReactivated ? 'Usuario reactivado' : 'Nuevo registro',
        },
        tx
      );

      return {
        success: true,
        message: wasReactivated ? MESSAGES.SUCCESS.REACTIVATED('Usuario') : MESSAGES.SUCCESS.CREATED('Usuario'),
        data: result as UserDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Usuario') };
  }
}

export async function updateUserAction(id: string, input: UserUpdateInput): Promise<ActionResult<UserDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    // Prevent an admin from mistakenly removing their own admin rights
    if (caller.id === id && input.role !== undefined && input.role !== 'admin') {
      return { success: false, error: 'No puedes revocar tus propios permisos de administrador.' };
    }

    const parsed = userUpdateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const updated = await userRepository.updateUser(id, parsed.data, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'USER', id, {
        username: updated.username,
        role: updated.role,
        changes: Object.keys(parsed.data)
          .filter((k) => k !== 'passwordHash' && k !== 'version')
          .reduce<Record<string, unknown>>((acc, k) => { acc[k] = (parsed.data as any)[k]; return acc; }, {}),
      }, tx);
      return {
        success: true,
        message: MESSAGES.SUCCESS.UPDATED('Usuario'),
        data: updated as UserDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Usuario') };
  }
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    if (caller.id === id) {
      return { success: false, error: 'No puedes Auto-Inmolarte (Eliminar tu propia cuenta).' };
    }

    return await db.transaction(async (tx) => {
      const user = await userRepository.getUserById(id, tx);
      if (!user) return { success: false, error: MESSAGES.ERROR.DATABASE.NOT_FOUND('Usuario') };

      // Rule 1: Only inactive users can be deleted
      if (user.isActive) {
        return { success: false, error: 'Primero debes desactivar al usuario para poder eliminarlo.' };
      }

      // Rule 2: Cannot delete users with history (Business check before DB constraint)
      const hasLogs = await userRepository.checkHasRelations(id, tx);
      if (hasLogs) {
        return { success: false, error: MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION };
      }

      await userRepository.deleteUser(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'USER', id, {
        username: user.username,
        role: user.role,
        note: 'Eliminado permanentemente (sin historial previo)',
      }, tx);

      return { success: true, message: MESSAGES.SUCCESS.DELETED('Usuario') };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Usuario') };
  }
}
