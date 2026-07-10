import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@wcad/database';

/**
 * Cliente de Supabase para el navegador (Client Components).
 * Usa las variables de entorno públicas NEXT_PUBLIC_*
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: process.env.NODE_ENV === 'production' ? '.wcadservice.com' : undefined,
        path: '/',
        sameSite: 'lax',
      },
    }
  );
}
