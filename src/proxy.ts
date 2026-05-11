import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

const publicPaths = ['/login', '/favicon.ico', '/icon.svg', '/api/public', '/home', '/product'];
const allowedVendedorPaths = ['/productos', '/ventas', '/clientes'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/__next') || pathname.match(/\.(png|jpg|jpeg|svg|css|js|ico)$/)) {
    return NextResponse.next();
  }

  const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const token = request.cookies.get('session')?.value;

  let isAuthenticated = false;
  let user: any = null;

  if (token) {
    try {
      user = await verifyToken(token);
      isAuthenticated = true;
    } catch {
      const response = NextResponse.redirect(new URL('/home', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  // 1. Redirigir a HOME si no está autenticado y no es ruta pública
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // 2. Redirigir fuera de LOGIN si ya está autenticado
  if (isAuthenticated && pathname === '/login') {
    const home = user.role === 'admin' ? '/' : '/productos';
    return NextResponse.redirect(new URL(home, request.url));
  }

  // 3. Protección de Rutas por ROL (RBAC) para Vendedor
  if (isAuthenticated && user.role === 'vendedor') {
    const isRoot = pathname === '/';
    const isAllowed = allowedVendedorPaths.some((p) => pathname.startsWith(p));

    if (isRoot || (!isPublicPath && !isAllowed)) {
      return NextResponse.redirect(new URL('/productos', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'], // All paths except static assets
};
