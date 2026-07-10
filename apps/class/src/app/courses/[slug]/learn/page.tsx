import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { getSignedVideoUrl } from '@wcad/utils/bunny';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronDown,
  Lock,
} from 'lucide-react';
import type { Metadata } from 'next';
import { LessonCompleteButton } from '@/components/lesson-complete-button';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Aula — ${slug} | WCAD` };
}

export default async function LearnPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { lesson: lessonId } = await searchParams;

  const supabase = await createServerSupabaseClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/courses/${slug}`);

  // Obtener curso con módulos y lecciones
  const { data: course } = await supabase
    .from('courses')
    .select(`
      id, title, slug, is_published,
      teacher:profiles!courses_teacher_id_fkey(id),
      modules(
        id, title, position,
        lessons(id, title, bunny_video_id, duration_seconds, position, is_free)
      )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courseData = course as any;
  if (!courseData) notFound();

  // Verificar enrollment (o si es el profesor del curso)
  const teacher = Array.isArray(courseData.teacher) ? courseData.teacher[0] : courseData.teacher;
  const isTeacher = teacher?.id === user.id;

  if (!isTeacher) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('course_id', courseData.id)
      .eq('status', 'active')
      .single();

    if (!enrollment) redirect(`/courses/${slug}`);
  }

  // Ordenar módulos y lecciones por posición
  const modules = (courseData.modules ?? [])
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
    .map((m: { lessons?: { position: number }[] } & object) => ({
      ...m,
      lessons: (m.lessons ?? []).sort(
        (a: { position: number }, b: { position: number }) => a.position - b.position
      ),
    }));

  const allLessons = modules.flatMap((m: { lessons: { id: string; bunny_video_id: string | null }[] }) => m.lessons);
  const allLessonIds = allLessons.map((l: { id: string }) => l.id);

  // Obtener progreso del estudiante (filtrado únicamente para las lecciones de este curso)
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed_at')
    .eq('student_id', user.id)
    .in('lesson_id', allLessonIds.length > 0 ? allLessonIds : ['00000000-0000-0000-0000-000000000000'])
    .not('completed_at', 'is', null);

  const progressData = progress as unknown as { lesson_id: string; completed_at: string | null }[];
  const completedIds = new Set(progressData?.map((p) => p.lesson_id) ?? []);

  // Determinar lección activa
  const activeLessonId = lessonId ?? allLessons[0]?.id;
  const activeLesson = allLessons.find((l: { id: string }) => l.id === activeLessonId) ?? allLessons[0];

  // Generar URL firmada del video (solo si hay videoId)
  let videoUrl: string | null = null;
  if (activeLesson?.bunny_video_id) {
    try {
      videoUrl = getSignedVideoUrl(activeLesson.bunny_video_id, 2);
    } catch {
      // En desarrollo sin BUNNY_TOKEN_KEY, usar URL pública
      videoUrl = `https://iframe.mediadelivery.net/embed/${process.env.BUNNY_LIBRARY_ID ?? 'demo'}/${activeLesson.bunny_video_id}`;
    }
  }

  // Calcular progreso total
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((l: { id: string }) => completedIds.has(l.id)).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--color-surface)]">
      {/* Header del aula */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Mis cursos
        </Link>
        <div className="mx-auto hidden max-w-sm flex-1 items-center gap-3 sm:flex">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-[var(--color-text-muted)]">
            {completedCount}/{totalLessons}
          </span>
        </div>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.webp" alt="WCAD Logo" width={28} height={28} className="h-7 w-auto shrink-0 object-contain" />
          <span className="hidden text-sm font-bold sm:block">WCAD</span>
        </Link>
      </header>

      {/* Cuerpo principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de lecciones */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface-alt)] lg:block">
          <div className="p-4">
            <h2 className="mb-4 text-sm font-semibold text-[var(--color-text)]">
              {courseData.title}
            </h2>

            <div className="space-y-2">
              {modules.map((module: {
                id: string;
                title: string;
                lessons: { id: string; title: string; duration_seconds: number; is_free: boolean }[];
              }) => {
                const isModuleActive = module.lessons.some(
                  (l) => l.id === activeLessonId
                );
                return (
                  <details key={module.id} open={isModuleActive || modules.indexOf(module) === 0}>
                    <summary className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]">
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[open]_&]:rotate-180" />
                      <span className="flex-1 line-clamp-1">{module.title}</span>
                    </summary>
                    <div className="mt-1 space-y-0.5 pl-3">
                      {module.lessons.map((lesson) => {
                        const isCompleted = completedIds.has(lesson.id);
                        const isActive = lesson.id === activeLessonId;
                        return (
                          <Link
                            key={lesson.id}
                            href={`/courses/${slug}/learn?lesson=${lesson.id}`}
                            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                              isActive
                                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                            )}
                            <span className="flex-1 line-clamp-2">{lesson.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Contenido principal: video */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          {/* Reproductor de video */}
          <div className="w-full bg-black">
            {videoUrl ? (
              <div className="mx-auto aspect-video max-h-[70vh] w-full">
                <iframe
                  src={videoUrl}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : (
              <div className="flex aspect-video max-h-[70vh] w-full items-center justify-center">
                <div className="text-center">
                  <Lock className="mx-auto mb-3 h-12 w-12 text-white/30" />
                  <p className="text-sm text-white/50">
                    Video no disponible
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Info de la lección */}
          {activeLesson && (
            <div className="mx-auto w-full max-w-4xl p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-[var(--color-text)] sm:text-2xl">
                    {activeLesson.title}
                  </h1>
                </div>

                {/* Botón marcar como completada — key fuerza recreación al cambiar lección */}
                <LessonCompleteButton
                  key={activeLesson.id}
                  lessonId={activeLesson.id}
                  isCompleted={completedIds.has(activeLesson.id)}
                />
              </div>

              {/* Navegación entre lecciones */}
              <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-6">
                {(() => {
                  const currentIdx = allLessons.findIndex(
                    (l: { id: string }) => l.id === activeLessonId
                  );
                  const prev = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
                  const next = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
                  return (
                    <>
                      {prev ? (
                        <Link
                          href={`/courses/${slug}/learn?lesson=${prev.id}`}
                          className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Link>
                      ) : (
                        <div />
                      )}
                      {next && (
                        <Link
                          href={`/courses/${slug}/learn?lesson=${next.id}`}
                          className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
                        >
                          Siguiente
                          <ChevronLeft className="h-4 w-4 rotate-180" />
                        </Link>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
