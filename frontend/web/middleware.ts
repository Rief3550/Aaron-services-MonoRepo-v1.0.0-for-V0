/**
 * Middleware de Next.js
 * Infrastructure layer - Protección de rutas en el servidor
 * 
 * NOTA: Con output: 'export', el middleware tiene limitaciones.
 * La protección real se hace en el cliente (AppLayout).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas (no requieren autenticación)
const publicRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir archivos estáticos y assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Con output: 'export', no podemos acceder a localStorage en el servidor
  // La protección real se hace en el cliente (AppLayout)
  // Solo permitimos que todas las rutas pasen, el cliente se encarga de la redirección
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

