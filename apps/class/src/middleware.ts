import { updateSession } from '@wcad/utils/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

// Rutas que requieren autenticación como estudiante
const PROTECTED_ROUTES = ['/dashboard', '/profile', '/courses/*/learn'];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Las rutas /preview/* son públicas (solo para revisar la UI en desarrollo)
  if (pathname.startsWith('/preview')) {
    return supabaseResponse;
  }

  // Verificar si la ruta actual es protegida
  const isProtected = PROTECTED_ROUTES.some((route) => {
    const regex = new RegExp(
      '^' + route.replace(/\*/g, '[^/]+') + '(/.*)?$'
    );
    return regex.test(pathname);
  });

  if (isProtected && !user) {
    // Redirigir a login si no está autenticado
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('login', 'true');
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Archivos de assets públicos
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
