import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';

export async function verifyAuthOrAdmin(requireAdmin = true) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) throw new Error('No autorizado (Token faltante)');
  
  const user = await verifyToken(token);
  if (requireAdmin && user.role !== 'admin') {
    throw new Error('Solo los administradores pueden realizar esta acción');
  }
  return user;
}
