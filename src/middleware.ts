import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

// Using Edge compatible jose library in verifyToken.
// Route matchers handled inside logic, avoiding unnecessary regexes if possible.

// Paths that must bypass authentication.
const publicPaths = ['/login', '/favicon.ico', '/api/public'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Next.js handle static assets seamlessly
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/__next') ||
    pathname.match(/\.(png|jpg|jpeg|svg|css|js|ico)$/)
  ) {
    return NextResponse.next();
  }

  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));
  const token = request.cookies.get('session')?.value;

  // Verify the JWT token on edge
  let isAuthenticated = false;
  if (token) {
    try {
      await verifyToken(token);
      isAuthenticated = true;
    } catch (e) {
      isAuthenticated = false;
    }
  }

  // Double Guard Strategy
  if (!isAuthenticated && !isPublicPath) {
    // If attempting to access a protected route unauthenticated, send to /login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && pathname === '/login') {
    // If logged in and hitting /login, redirect back to home / dashboard
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Continue to the requested path. 
  // Individual Sever Actions enforce roles on a per-action basis as well.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'], // All paths except static assets
};
