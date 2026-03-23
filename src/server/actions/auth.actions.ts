'use server';

import { cookies } from 'next/headers';
import * as bcrypt from 'bcrypt';
import { loginSchema, LoginInput, Role } from '@/schemas/auth.schema';
import { userRepository } from '@/server/repositories/user.repository';
import { signToken } from '@/lib/auth/jwt';

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
 * Logs out the user if invalid, sets HTTP-only cookie if valid.
 *
 * @param input - The payload containing username and raw password
 * @returns A result indicating success or failure message
 */
export async function loginAction(input: LoginInput): Promise<LoginResult> {
  try {
    // 1. Validate payload
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: 'Formato de datos inválido' };
    }

    const { username, password } = parsed.data;

    // 2. Look up the user by username
    const user = await userRepository.getUserByUsername(username);
    if (!user) {
      return { success: false, message: 'Credenciales inválidas' };
    }

    // 3. Verify the hash to ensure the password is correct
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, message: 'Credenciales inválidas' };
    }

    // 4. Construct a secure user session
    const sessionPayload = {
      id: user.id,
      username: user.username,
      role: user.role as Role,
    };

    // 5. Sign JWT token via jose
    const token = await signToken(sessionPayload);

    // 6. Persist token in HttpOnly cookie allowing secure transmission
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return {
      success: true,
      user: sessionPayload,
    };
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
