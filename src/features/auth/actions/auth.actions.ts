'use server';

import { cookies } from 'next/headers';
import * as bcrypt from 'bcrypt';
import { loginSchema, LoginInput, Role } from '@/features/auth/domain/auth.schema';
import { userRepository } from '@/features/user/repository/user.repository';
import { signToken } from '@/lib/auth/jwt';
import { recordAuditLog } from '@/lib/audit-logs';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { db } from '@/lib/db';

type LoginResult = {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    username: string;
    role: Role;
  };
};

/**
 * Handles the authentication process from the server side.
 */
export async function loginAction(input: LoginInput): Promise<LoginResult> {
  try {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Formato de datos inválido' };

    const { username, password } = parsed.data;

    return await db.transaction(async (tx) => {
      const user = await userRepository.getUserByUsername(username, tx);
      if (!user) return { success: false, message: 'Credenciales inválidas' };

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) return { success: false, message: 'Credenciales inválidas' };

      const sessionPayload = { id: user.id, username: user.username, role: user.role as Role };
      const token = await signToken(sessionPayload);

      const cookieStore = await cookies();
      cookieStore.set('session', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      await recordAuditLog(user.id, 'LOGIN', 'USER', user.id, { username: user.username }, tx);

      return { success: true, user: sessionPayload };
    });
  } catch (error) {
    console.error('Error during login action:', error);
    return { success: false, message: 'An internal error occurred.' };
  }
}

/**
 * Logs the currently authenticated user out by destroying their session cookie.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

/**
 * Registers an audit log when a session is restored via cookie (SPA initialization).
 */
export async function logSessionRestoredAction() {
  try {
    const user = await verifyAuthOrAdmin(false);
    if (user) {
      return await db.transaction(async (tx) => {
        await recordAuditLog(user.id, 'LOGIN', 'USER', user.id, {
          method: 'cookie',
          username: user.username,
          message: 'Sesión restaurada automáticamente',
        }, tx);
        return { success: true };
      });
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}
