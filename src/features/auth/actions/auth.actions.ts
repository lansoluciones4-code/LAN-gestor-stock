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

// --- IN-MEMORY RATE LIMITER ---
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

type RateLimitData = { count: number; blockedUntil: number | null };

const globalForAuth = globalThis as unknown as { rateLimitCache: Map<string, RateLimitData> };
const rateLimitCache = globalForAuth.rateLimitCache || new Map<string, RateLimitData>();
if (process.env.NODE_ENV !== 'production') globalForAuth.rateLimitCache = rateLimitCache;

function recordFailure(username: string, data: RateLimitData, now: number) {
  data.count += 1;
  if (data.count >= MAX_ATTEMPTS) {
    data.blockedUntil = now + BLOCK_DURATION_MS;
  }
  rateLimitCache.set(username, data);
}
// ------------------------------

/**
 * Handles the authentication process from the server side.
 */
export async function loginAction(input: LoginInput): Promise<LoginResult> {
  try {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Formato de datos inválido' };

    const { username, password } = parsed.data;

    // --- RATE LIMIT CHECK ---
    const now = Date.now();
    const limitData = rateLimitCache.get(username) || { count: 0, blockedUntil: null };

    if (limitData.blockedUntil && now < limitData.blockedUntil) {
      const remainingMinutes = Math.ceil((limitData.blockedUntil - now) / 60000);
      return { success: false, message: `Demasiados intentos. Cuenta bloqueada temporalmente por ${remainingMinutes} minutos.` };
    }

    if (limitData.blockedUntil && now >= limitData.blockedUntil) {
      // Unblock if time passed
      limitData.count = 0;
      limitData.blockedUntil = null;
      rateLimitCache.set(username, limitData);
    }
    // ------------------------

    return await db.transaction(async (tx) => {
      const user = await userRepository.getUserByUsername(username, tx);
      if (!user) {
        recordFailure(username, limitData, now);
        return { success: false, message: 'Credenciales inválidas' };
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        recordFailure(username, limitData, now);
        return { success: false, message: 'Credenciales inválidas' };
      }

      // Success: Clear failed attempts
      rateLimitCache.delete(username);

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
    return { success: false, message: 'Ocurrió un error interno. Intente nuevamente.' };
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
        await recordAuditLog(
          user.id,
          'LOGIN',
          'USER',
          user.id,
          {
            method: 'cookie',
            username: user.username,
            message: 'Sesión restaurada automáticamente',
          },
          tx
        );
        return { success: true };
      });
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}
