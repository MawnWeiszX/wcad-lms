import { updateSession } from '@wcad/utils/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware del Panel del Profesor.
 * Verifica que el usuario esté autenticado, tenga rol de profesor
 * y su modo de vista activo sea 'profesor'.
 */
export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Rutas /preview son públicas (solo para revisar la UI en desarrollo)
  if (pathname.startsWith('/preview')) {
    return supabaseResponse;
  }

  const classUrl = process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000';

  // Si no hay usuario autenticado, redirigir al login en class
  if (!user) {
    return NextResponse.redirect(`${classUrl}/?login=true`);
  }

  // El rol se lee directamente del JWT (app_metadata) sin consultar la BD.
  // El trigger `on_profile_role_change` en Postgres mantiene este valor
  // sincronizado automáticamente cada vez que cambia el rol del perfil.
  const role = user.app_metadata?.role as string | undefined;
  const isProfesor = role === 'profesor' || role === 'teacher' || role === 'admin';
  const modoActivo = request.cookies.get('modoActivo')?.value;

  // Si no es profesor o el modo activo es 'alumno', denegar acceso y redirigir a Class
  if (!isProfesor || modoActivo !== 'profesor') {
    return NextResponse.redirect(classUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
