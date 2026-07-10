import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ProfileSettingsForm } from '@/components/profile-settings-form';
import { Settings } from 'lucide-react';

export const metadata: Metadata = { title: 'Configuración' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`${process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000'}/`);

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, bio, country_code, email, role')
    .eq('id', user.id)
    .single();

  const profile = profileRaw as {
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    country_code: string | null;
    email: string | null;
    role: string;
  } | null;

  // ── Sincronizar avatar de Google si aún no está guardado ──
  // Supabase guarda la foto de Google en user_metadata pero no en profiles
  const googleAvatar = user.user_metadata?.avatar_url as string | undefined;
  let resolvedAvatar = profile?.avatar_url ?? null;

  if (!resolvedAvatar && googleAvatar) {
    // Guardar la foto de Google en el perfil automáticamente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('profiles')
      .update({ avatar_url: googleAvatar })
      .eq('id', user.id);
    resolvedAvatar = googleAvatar;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent-bg)] text-[var(--color-primary)]">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Configuración</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Gestiona tu perfil de profesor.</p>
        </div>
      </div>

      <ProfileSettingsForm
        userId={user.id}
        initialData={{
          full_name: profile?.full_name ?? '',
          bio: profile?.bio ?? '',
          country_code: profile?.country_code ?? '',
          role: profile?.role ?? 'teacher',
          avatar_url: resolvedAvatar,
          email: profile?.email ?? user.email ?? '',
        }}
      />
    </div>
  );
}
