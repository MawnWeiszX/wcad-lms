import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@wcad/database';

/**
 * Cliente de Supabase para Server Components y Route Handlers.
 * Lee y escribe cookies de sesión automáticamente.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(process.env.NODE_ENV === 'production' && {
                  domain: '.wcadservice.com',
                }),
              })
            );
          } catch {
            // setAll se puede llamar desde Server Components donde
            // no se pueden establecer cookies. Esto se ignora si
            // el middleware refresca la sesión.
          }
        },
      },
    }
  );
}

/**
 * Cliente de Supabase con permisos de administrador.
 * ⚠️ SOLO usar en Server Actions y Route Handlers seguros.
 * Bypasea toda la RLS.
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}
