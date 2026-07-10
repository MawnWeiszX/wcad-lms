import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ProfileForm } from '@/components/profile-form';
import { StudentLayout } from '@/components/student-layout';

export const metadata: Metadata = {
  title: 'Mi Perfil — WCAD',
  description: 'Edita tu información de perfil en WCAD.',
};
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

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

  // ── Sincronizar avatar de Google automáticamente ────────
  const googleAvatar = user.user_metadata?.avatar_url as string | undefined;
  let resolvedAvatar = profile?.avatar_url ?? null;

  if (!resolvedAvatar && googleAvatar) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('profiles')
      .update({ avatar_url: googleAvatar })
      .eq('id', user.id);
    resolvedAvatar = googleAvatar;
  }

  const userInfo = {
    email: user.email ?? '',
    name: profile?.full_name ?? user.email ?? null,
    avatarUrl: resolvedAvatar,
    role: profile?.role ?? 'student',
  };

  return (
    <StudentLayout user={userInfo}>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="mb-8 text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
          Mi perfil
        </h1>

        <ProfileForm
          userId={user.id}
          initialData={{
            full_name: profile?.full_name ?? '',
            bio: profile?.bio ?? '',
            country_code: profile?.country_code ?? '',
            role: profile?.role ?? 'student',
            avatar_url: resolvedAvatar,
            email: profile?.email ?? user.email ?? '',
          }}
        />
      </div>
    </StudentLayout>
  );
}
