import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  Users,
  BarChart3,
  CheckCircle2,
  Play,
  Lock,
  ChevronRight,
} from 'lucide-react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { EnrollButton } from '@/components/enroll-button';
import { cache } from 'react';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Función cacheada para obtener el curso completo. Evita la duplicación de consultas SQL
// entre generateMetadata y el renderizado principal en el mismo ciclo de petición (request).
const getCourse = cache(async (slug: string) => {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from('courses')
    .select(`
      id, title, slug, short_description, description, thumbnail_url,
      trailer_video_id, price, currency, level, total_duration_seconds,
      students_count, is_free, what_you_learn, requirements,
      teacher:profiles!courses_teacher_id_fkey(id, full_name, avatar_url, bio),
      category:categories(name, slug),
      modules(
        id, title, description, position,
        lessons(id, title, duration_seconds, position, is_free)
      )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .order('position', { referencedTable: 'modules' })
    .single();
});

// Generación dinámica de metadata SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: course } = await getCourse(slug);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courseData = course as any;
  if (!courseData) return { title: 'Curso no encontrado — WCAD' };

  return {
    title: `${courseData.title} — WCAD`,
    description: courseData.short_description ?? undefined,
  };
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
}

function formatLevel(level: string): string {
  const labels: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  };
  return labels[level] ?? level;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser();

  // Perfil y curso se pueden obtener en paralelo
  const [profileResult, { data: courseRaw }] = await Promise.all([
    user
      ? supabase.from('profiles').select('full_name, avatar_url, role').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    getCourse(slug),
  ]);

  const profile = profileResult.data as { full_name: string | null; avatar_url: string | null; role: string } | null;

  if (!courseRaw) notFound();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const course = courseRaw as any;

  const userInfo = user ? {
    email: user.email ?? '',
    name: profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    role: profile?.role ?? 'student',
  } : null;

  // Verificar si el usuario está inscrito
  let isEnrolled = false;
  if (user) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', course.id)
      .eq('status', 'active')
      .single();
    isEnrolled = !!enrollment;
  }

  const category = Array.isArray(course.category) ? course.category[0] : course.category;
  const modules = course.modules ?? [];

  const totalLessons = modules.reduce(
    (acc: number, m: { lessons?: unknown[] }) => acc + (m.lessons?.length ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-[var(--color-surface)] pt-16">
      <Navbar user={userInfo} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Link href="/" className="hover:text-[var(--color-text)]">Inicio</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/courses" className="hover:text-[var(--color-text)]">Cursos</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-[var(--color-text)]">{course.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Encabezado del curso */}
            <div>
              {category && (
                <span className="mb-3 inline-block rounded-full bg-[var(--color-accent-bg)] px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                  {category.name}
                </span>
              )}
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
                {course.title}
              </h1>
              {course.short_description && (
                <p className="mt-4 text-lg text-[var(--color-text-secondary)]">
                  {course.short_description}
                </p>
              )}

              {/* Stats */}
              <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {course.students_count.toLocaleString()} estudiantes
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatDuration(course.total_duration_seconds)}
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  {formatLevel(course.level)}
                </span>
              </div>
            </div>

            {/* Trailer / Thumbnail */}
            {course.trailer_video_id ? (
              <div className="aspect-video overflow-hidden rounded-2xl">
                <iframe
                  src={`https://iframe.mediadelivery.net/embed/${process.env.BUNNY_LIBRARY_ID ?? ''}/${course.trailer_video_id}`}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : course.thumbnail_url ? (
              <div className="relative aspect-video overflow-hidden rounded-2xl">
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl bg-[var(--color-surface-alt)]">
                <Play className="h-16 w-16 text-[var(--color-text-muted)]" />
              </div>
            )}

            {/* Lo que aprenderás */}
            {course.what_you_learn && course.what_you_learn.filter(Boolean).length > 0 && (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-6">
                <h2 className="mb-4 text-xl font-semibold text-[var(--color-text)]">
                  Lo que aprenderás
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {course.what_you_learn.filter(Boolean).map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Descripción */}
            {course.description && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-[var(--color-text)]">
                  Sobre este curso
                </h2>
                <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {course.description}
                </div>
              </div>
            )}

            {/* Temario */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-[var(--color-text)]">
                Contenido del curso
              </h2>
              <p className="mb-4 text-sm text-[var(--color-text-muted)]">
                {modules.length} módulos · {totalLessons} lecciones ·{' '}
                {formatDuration(course.total_duration_seconds)} de contenido
              </p>

              <div className="space-y-3">
                {modules.map((module: { id: string; title: string; lessons?: { id: string; title: string; duration_seconds: number; is_free: boolean }[] }) => (
                  <details
                    key={module.id}
                    className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
                  >
                    <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] rounded-xl">
                      <span>{module.title}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {module.lessons?.length ?? 0} lecciones
                      </span>
                    </summary>
                    <div className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                      {module.lessons?.map((lesson: { id: string; title: string; duration_seconds: number; is_free: boolean }) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between px-4 py-3 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            {lesson.is_free ? (
                              <Play className="h-4 w-4 text-[var(--color-primary)]" />
                            ) : (
                              <Lock className="h-4 w-4 text-[var(--color-text-muted)]" />
                            )}
                            <span className="text-[var(--color-text-secondary)]">
                              {lesson.title}
                            </span>
                            {lesson.is_free && (
                              <span className="rounded bg-[var(--color-accent-bg)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                                Gratis
                              </span>
                            )}
                          </div>
                          <span className="text-[var(--color-text-muted)]">
                            {formatDuration(lesson.duration_seconds)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* Requisitos previos */}
            {course.requirements && course.requirements.filter(Boolean).length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[var(--color-text)]">
                  Requisitos previos
                </h2>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-[var(--color-text-secondary)]">
                  {course.requirements.filter(Boolean).map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}


          </div>

          {/* Sidebar de compra (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-black/5">
              {/* Precio en soles */}
              <div className="mb-6">
                <div className="text-3xl font-bold text-[var(--color-text)]">
                  {course.is_free || Number(course.price) === 0
                    ? 'Gratis'
                    : `S/ ${Number(course.price).toFixed(2)}`}
                </div>
              </div>

              {/* CTA */}
              {isEnrolled ? (
                <Link
                  href={`/courses/${course.slug}/learn`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3.5 text-base font-semibold text-white transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98]"
                >
                  <Play className="h-5 w-5" />
                  Ir al aula
                </Link>
              ) : (
                <EnrollButton
                  courseId={course.id}
                  courseSlug={course.slug}
                  courseTitle={course.title}
                  coursePrice={Number(course.price)}
                  courseThumbnailUrl={course.thumbnail_url}
                  isLoggedIn={!!user}
                  isFree={course.is_free || Number(course.price) === 0}
                />
              )}

              {/* Lo que incluye */}
              <div className="mt-6 space-y-3">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Este curso incluye:
                </p>
                {[
                  `${formatDuration(course.total_duration_seconds)} de contenido en video`,
                  `${totalLessons} lecciones`,
                  'Acceso de por vida',
                  'Certificado de finalización',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
