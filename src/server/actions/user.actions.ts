'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { userRepository } from '@/server/repositories/user.repository';
import { userSchema, UserInput } from '@/schemas/user.schema';
import { verifyToken } from '@/lib/auth/jwt';

async function verifyAuthOrAdmin(requireAdmin = true) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) throw new Error('No autorizado (Token faltante)');
  
  const user = await verifyToken(token);
  if (requireAdmin && user.role !== 'admin') {
    throw new Error('Solo los administradores pueden realizar esta acción');
  }
  return user;
}

export async function fetchUsers() {
  try {
    await verifyAuthOrAdmin(true);
    const usersList = await userRepository.getAllUsers();
    return usersList;
  } catch (error) {
    console.error('fetchUsers error:', error);
    return [];
  }
}

export async function createUserAction(input: UserInput) {
  try {
    await verifyAuthOrAdmin(true);
    const parsed = userSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await userRepository.createUser(parsed.data);
    revalidatePath('/usuarios');
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
    return { success: true, message: 'Usuario eliminado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al eliminar usuario' };
  }
}
