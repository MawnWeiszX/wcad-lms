import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { LessonEditor } from '@/components/lesson-editor';

export const metadata: Metadata = { title: 'Editar lección' };
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string; lessonId: string }>;
}

export default async function LessonEditorPage({ params }: Props) {
  const { id: courseId, lessonId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`${process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000'}/`);

  // Verificar que la lección pertenece a un curso del profesor
  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      id, title, duration_seconds, position, is_free, bunny_video_id,
      module:modules!lessons_module_id_fkey(
        id, title,
        course:courses!modules_course_id_fkey(id, title, teacher_id)
      )
    `)
    .eq('id', lessonId)
    .single();

  if (!lesson) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lessonData = lesson as any;
  const lessonModule = Array.isArray(lessonData.module) ? lessonData.module[0] : lessonData.module;
  const course = lessonModule ? (Array.isArray(lessonModule.course) ? lessonModule.course[0] : lessonModule.course) : null;

  // Solo el teacher del curso puede editar
  if (course?.teacher_id !== user.id) notFound();

  // Verificar si Bunny está configurado
  const bunnyConfigured = !!(
    process.env.BUNNY_API_KEY &&
    process.env.BUNNY_LIBRARY_ID
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/courses/${courseId}`}
          className="mb-3 flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          <ChevronLeft className="h-4 w-4" />
          {course?.title ?? 'Volver al curso'}
        </Link>
        <div>
          <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">
            {lessonModule?.title}
          </p>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            {lessonData.title}
          </h1>
        </div>
      </div>

      <LessonEditor
        lesson={{
          id: lessonData.id,
          title: lessonData.title,
          duration_seconds: lessonData.duration_seconds,
          is_free: lessonData.is_free,
          bunny_video_id: lessonData.bunny_video_id,
        }}
        bunnyConfigured={bunnyConfigured}
        bunnyLibraryId={process.env.BUNNY_LIBRARY_ID ?? ''}
      />
    </div>
  );
}
