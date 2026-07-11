import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Ruta de callback para Google OAuth.
 * Intercambia el código de autorización por una sesión
 * y redirige según el rol del usuario.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/dashboard';

  // Evitar open redirect limitando 'next' a rutas relativas seguras
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/dashboard';
  }

  if (code) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createServerSupabaseClient()) as any;

    // Intercambiar código por sesión
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Obtener el perfil del usuario para determinar el rol
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const isProfesor = profile?.role === 'profesor' || profile?.role === 'teacher' || profile?.role === 'admin';
        const initialModo = isProfesor ? 'profesor' : 'alumno';

        let redirectUrl = `${origin}${next}`;
        if (isProfesor) {
          const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3001';
          redirectUrl = `${portalUrl}/dashboard`;
        }

        const response = NextResponse.redirect(redirectUrl);

        // Guardar cookie de modo activo compartida para el middleware del portal
        const host = request.headers.get('host') ?? '';
        const cookieDomain = (process.env.NODE_ENV === 'production' && host.endsWith('wcadservice.com'))
          ? '.wcadservice.com'
          : undefined;
        
        response.cookies.set('modoActivo', initialModo, {
          domain: cookieDomain,
          path: '/',
          maxAge: 31536000,
          sameSite: 'lax',
        });

        return response;
      }
    }
  }

  // Si hay error, redirigir al inicio con mensaje de error
  return NextResponse.redirect(`${origin}/?error=auth`);
}
