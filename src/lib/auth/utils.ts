import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { userRepository } from '@/features/user/repository/user.repository';

export async function verifyAuthOrAdmin(requireAdmin = true) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) throw new Error('No autorizado (Token faltante)');

  const sessionUser = await verifyToken(token);

  // Verify user still exists and is active in DB (important for stale sessions)
  const dbUser = await userRepository.getUserById(sessionUser.id);
  if (!dbUser || !dbUser.isActive) {
    throw new Error('Sesión inválida o usuario desactivado. Por favor, cierre sesión y vuelva a entrar.');
  }

  if (requireAdmin && dbUser.role !== 'admin') {
    throw new Error('Solo los administradores pueden realizar esta acción');
  }

  return dbUser;
}
