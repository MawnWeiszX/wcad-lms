/**
 * Layout compartido para todas las páginas autenticadas del portal.
 * Incluye sidebar de navegación y header superior.
 */
import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { redirect } from 'next/navigation';
import { PortalSidebar } from '@/components/portal-sidebar';
import { ToastProvider } from '@/components/toast';
import { Breadcrumbs } from '@/components/breadcrumbs';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`${process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000'}/?login=true`);

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single();

  const profile = profileData as { full_name: string | null; avatar_url: string | null; role: string } | null;

  // Solo teachers y admins pueden usar el portal
  if (profile?.role === 'student') {
    redirect(`${process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000'}/dashboard`);
  }

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--color-surface-alt)]">
        {/* Sidebar */}
        <PortalSidebar profile={profile} />

        {/* Contenido principal */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <Breadcrumbs />
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
