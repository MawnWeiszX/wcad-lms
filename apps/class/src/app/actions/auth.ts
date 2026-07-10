'use server';

import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Server Action: inicia el flujo OAuth con Google.
 * Genera la URL de autorización y redirige al usuario.
 */
export async function signInWithGoogle(next?: string) {
  const supabase = await createServerSupabaseClient();
  const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: next
        ? `${callbackUrl}?next=${encodeURIComponent(next)}`
        : callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error || !data.url) {
    redirect('/?error=auth');
  }

  redirect(data.url);
}

/**
 * Server Action: cierra la sesión del usuario.
 */
export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
