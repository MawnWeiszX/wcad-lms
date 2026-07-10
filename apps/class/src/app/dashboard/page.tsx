import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, TrendingUp, GraduationCap, Play, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import { StudentLayout } from '@/components/student-layout';

export const metadata: Metadata = {
  title: 'Mi Panel — WCAD',
  description: 'Tus cursos, progreso y estadísticas de aprendizaje.',
};

// ── Barra de progreso ──────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
      <div
        className="h-full rounded-full bg-[var(--color-primary)] transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Obtener perfil, enrollments y progreso en paralelo
  const [{ data: profileRaw }, { data: enrollmentsRaw }, { data: progressRaw }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, avatar_url, role')
      .eq('id', user.id)
      .single(),
    supabase
      .from('enrollments')
      .select(`
        id, enrolled_at, status,
        course:courses(
          id, title, slug, thumbnail_url, total_duration_seconds,
          modules(lessons(id))
        )
      `)
      .eq('student_id', user.id)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: false }),
    supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at')
      .eq('student_id', user.id)
      .not('completed_at', 'is', null),
  ]);

  const profile = profileRaw as unknown as {
    full_name: string | null;
    avatar_url: string | null;
    role: string;
  } | null;

  interface CourseModuleLesson { id: string; }
  interface CourseModule { lessons: CourseModuleLesson[] | null; }
  interface CourseDetails {
    id: string; title: string; slug: string;
    thumbnail_url: string | null; total_duration_seconds: number;
    modules: CourseModule[] | null;
  }
  interface EnrollmentWithCourse {
    id: string; enrolled_at: string; status: string;
    course: CourseDetails | CourseDetails[] | null;
  }

  const enrollments = enrollmentsRaw as unknown as EnrollmentWithCourse[] | null;
  const progress = progressRaw as unknown as { lesson_id: string }[] | null;

  const completedLessonIds = new Set(
    progress?.map((p) => p.lesson_id) ?? []
  );

  // Calcular progreso por curso
  const enrollmentsWithProgress = (enrollments ?? []).map((enrollment) => {
    const course = Array.isArray(enrollment.course)
      ? enrollment.course[0]
      : enrollment.course;

    if (!course) return { ...enrollment, course: null, progressPercent: 0, completedLessons: 0, totalLessons: 0 };

    const allLessons = (course.modules ?? []).flatMap(
      (m) => m.lessons ?? []
    );
    const totalLessons = allLessons.length;
    const completedLessons = allLessons.filter((l) =>
      completedLessonIds.has(l.id)
    ).length;
    const progressPercent = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    return { ...enrollment, course, progressPercent, completedLessons, totalLessons };
  });

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Estudiante';
  const totalCourses = enrollmentsWithProgress.length;
  const completedCourses = enrollmentsWithProgress.filter((e) => e.progressPercent === 100).length;
  const inProgress = enrollmentsWithProgress.filter((e) => e.progressPercent > 0 && e.progressPercent < 100).length;

  const userInfo = {
    email: user.email ?? '',
    name: profile?.full_name ?? user.email ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };

  return (
    <StudentLayout user={userInfo}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Saludo */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
            ¡Hola, {firstName}! 👋
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Aquí está tu resumen de aprendizaje.
          </p>
        </div>

        {/* Stats rápidas */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: BookOpen, label: 'Cursos inscritos', value: totalCourses, color: 'text-[var(--color-primary)]' },
            { icon: TrendingUp, label: 'En progreso', value: inProgress, color: 'text-amber-500' },
            { icon: GraduationCap, label: 'Completados', value: completedCourses, color: 'text-emerald-500' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-alt)] ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text)]">{stat.value}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mis cursos */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">Mis cursos</h2>
            <Link
              href="/courses"
              className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
            >
              Explorar más
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {enrollmentsWithProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] py-20 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-[var(--color-text-muted)]" />
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                Aún no tienes cursos
              </h3>
              <p className="mt-2 mb-6 text-sm text-[var(--color-text-secondary)]">
                Explora el catálogo y encuentra el curso perfecto para ti.
              </p>
              <Link
                href="/courses"
                className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
              >
                Explorar cursos
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {enrollmentsWithProgress.map((enrollment) => {
                const course = enrollment.course;
                if (!course) return null;

                return (
                  <div
                    key={enrollment.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-all hover:shadow-lg"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-[var(--color-surface-alt)]">
                      {course.thumbnail_url ? (
                        <Image
                          src={course.thumbnail_url}
                          alt={course.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-10 w-10 text-[var(--color-text-muted)]" />
                        </div>
                      )}
                      {/* Badge de progreso */}
                      <div className="absolute right-3 top-3 rounded-full bg-[var(--color-surface)]/90 px-2.5 py-1 text-xs font-bold text-[var(--color-primary)] backdrop-blur-sm">
                        {enrollment.progressPercent}%
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="line-clamp-2 font-semibold text-[var(--color-text)]">
                        {course.title}
                      </h3>

                      {/* Progreso */}
                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                          <span>{enrollment.completedLessons} de {enrollment.totalLessons} lecciones</span>
                          <span>{enrollment.progressPercent}% completado</span>
                        </div>
                        <ProgressBar value={enrollment.progressPercent} />
                      </div>

                      {/* CTA */}
                      <Link
                        href={`/courses/${course.slug}/learn`}
                        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[var(--color-primary)] py-2.5 text-sm font-semibold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)] hover:text-white"
                      >
                        <Play className="h-4 w-4" />
                        {enrollment.progressPercent === 0 ? 'Comenzar' : enrollment.progressPercent === 100 ? 'Repasar' : 'Continuar'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
