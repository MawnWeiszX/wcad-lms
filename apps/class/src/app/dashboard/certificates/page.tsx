import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Award, Calendar, Download } from 'lucide-react';
import type { Metadata } from 'next';
import { StudentLayout } from '@/components/student-layout';

export const metadata: Metadata = {
  title: 'Mis Certificados — WCAD',
  description: 'Descarga tus certificados de finalización de cursos.',
};

export default async function CertificatesPage() {
  const supabase = await createServerSupabaseClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Obtener perfil del usuario
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single();

  const profile = profileData as { full_name: string | null; avatar_url: string | null; role: string } | null;


  // Obtener enrollments con cursos y lecciones para calcular progreso
  const { data: enrollmentsData } = await supabase
    .from('enrollments')
    .select(`
      id, enrolled_at, status,
      course:courses(
        id, title, slug, thumbnail_url, total_duration_seconds,
        modules(lessons(id))
      )
    `)
    .eq('student_id', user.id)
    .eq('status', 'active');

  interface CertificateEnrollment {
    id: string;
    enrolled_at: string;
    status: string;
    course: {
      id: string;
      title: string;
      slug: string;
      thumbnail_url: string | null;
      total_duration_seconds: number;
      modules: { lessons?: { id: string }[] }[] | null;
    } | {
      id: string;
      title: string;
      slug: string;
      thumbnail_url: string | null;
      total_duration_seconds: number;
      modules: { lessons?: { id: string }[] }[] | null;
    }[] | null;
  }

  const enrollments = enrollmentsData as unknown as CertificateEnrollment[] | null;

  // Obtener progreso de lecciones completadas
  const { data: progressData } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('student_id', user.id)
    .not('completed_at', 'is', null);

  const progress = progressData as { lesson_id: string }[] | null;
  const completedLessonIds = new Set(progress?.map((p) => p.lesson_id) ?? []);

  // Filtrar solo los cursos que tienen 100% de progreso (completados)
  const completedCourses = (enrollments ?? [])
    .map((enrollment) => {
      const course = Array.isArray(enrollment.course) ? enrollment.course[0] : enrollment.course;
      if (!course) return null;

      const allLessons = (course.modules ?? []).flatMap(
        (m: { lessons?: { id: string }[] }) => m.lessons ?? []
      );
      const totalLessons = allLessons.length;
      const completedLessons = allLessons.filter((l: { id: string }) =>
        completedLessonIds.has(l.id)
      ).length;
      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnailUrl: course.thumbnail_url,
        completedAt: enrollment.enrolled_at, // Simplificación como fecha del certificado
        progressPercent,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null && c.progressPercent === 100);

  const userInfo = {
    email: user.email ?? '',
    name: profile?.full_name ?? user.email ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };

  return (
    <StudentLayout user={userInfo}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
            Mis Certificados 🎓
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Aquí encontrarás los certificados de los cursos que has completado satisfactoriamente.
          </p>
        </div>

        {completedCourses.length === 0 ? (
          /* Estado vacío */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-20 px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">
              Aún no tienes certificados
            </h3>
            <p className="mt-2 mb-6 max-w-md text-sm text-[var(--color-text-secondary)]">
              Completa el 100% de las lecciones de tus cursos activos para obtener tu certificación digital avalada por WCAD Service.
            </p>
            <Link
              href="/dashboard"
              className="rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all"
            >
              Ir a mis cursos
            </Link>
          </div>
        ) : (
          /* Grid de certificados */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {completedCourses.map((c) => (
              <div
                key={c.id}
                className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all hover:shadow-md"
              >
                {/* Visual Certificate Card Header */}
                <div className="relative aspect-video w-full bg-[var(--color-accent-bg)] flex flex-col justify-between p-5 border-b border-[var(--color-border)] overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 opacity-10">
                    <Award className="h-32 w-32 text-[var(--color-primary)]" />
                  </div>
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] font-bold tracking-wider text-[var(--color-primary)] uppercase">
                      Certificado de Finalización
                    </span>
                    <Award className="h-5 w-5 text-amber-500" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--color-text)] line-clamp-2 pr-6 z-10 leading-snug">
                    {c.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-[var(--color-text-secondary)] font-medium z-10">
                    <span>Otorgado a: {userInfo.name}</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="p-5 flex items-center justify-between bg-[var(--color-surface)]">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(c.completedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <a
                    href={`/api/certificate?course=${c.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
