import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CoursePageEditor } from '@/components/course-page-editor';

export const metadata: Metadata = { title: 'Editar curso' };
export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

interface CourseQueryResponse {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number;
  currency: string;
  level: string;
  category_id: string | null;
  is_published: boolean;
  is_free: boolean;
  thumbnail_url: string | null;
  trailer_video_id: string | null;
  total_duration_seconds: number;
  students_count: number;
  teacher: { full_name: string | null; avatar_url: string | null; bio: string | null } | { full_name: string | null; avatar_url: string | null; bio: string | null }[] | null;
  category: { name: string } | { name: string }[] | null;
  modules: {
    id: string;
    title: string;
    position: number;
    lessons?: {
      id: string;
      title: string;
      duration_seconds: number;
      position: number;
      is_free: boolean;
      bunny_video_id: string | null;
    }[];
  }[];
  what_you_learn?: string[];
  requirements?: string[];
}

export default async function CourseEditorPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`${process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000'}/`);

  const [{ data: courseData }, { data: categories }] = await Promise.all([
    supabase
      .from('courses')
      .select(`
        id, title, slug, short_description, description,
        price, currency, level, category_id, is_published, is_free,
        thumbnail_url, trailer_video_id,
        total_duration_seconds, students_count,
        what_you_learn, requirements,
        teacher:profiles!courses_teacher_id_fkey(full_name, avatar_url, bio),
        category:categories(name),
        modules(
          id, title, position,
          lessons(id, title, duration_seconds, position, is_free, bunny_video_id)
        )
      `)
      .eq('id', id)
      .eq('teacher_id', user.id)
      .single(),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  if (!courseData) notFound();
  const course = courseData as unknown as CourseQueryResponse;

  const modules = (course.modules ?? [])
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
    .map((m) => ({
      id: m.id,
      title: m.title,
      position: m.position,
      lessons: (m.lessons ?? [])
        .sort((a: { position: number }, b: { position: number }) => a.position - b.position),
    }));

  const teacher = Array.isArray(course.teacher) ? course.teacher[0] : course.teacher;
  const category = Array.isArray(course.category) ? course.category[0] : course.category;

  const bunnyLibraryId = process.env.BUNNY_LIBRARY_ID ?? '';
  const bunnyConfigured = !!(process.env.BUNNY_API_KEY && bunnyLibraryId);

  return (
    <div className="-m-6 lg:-m-8">
      {/* Header navegación */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 lg:px-8">
        <Link href="/courses"
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
          <ChevronLeft className="h-4 w-4" />
          Mis cursos
        </Link>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            course.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {course.is_published ? 'Publicado' : 'Borrador'}
          </span>
          <a href={`${process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000'}/courses/${course.slug}`} target="_blank" rel="noopener noreferrer"
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]">
            Ver página pública ↗
          </a>
        </div>
      </div>

      <CoursePageEditor
        course={{
          id: course.id,
          title: course.title,
          slug: course.slug,
          short_description: course.short_description,
          description: course.description,
          price: course.price,
          currency: course.currency,
          level: course.level,
          category_id: course.category_id,
          is_published: course.is_published,
          is_free: course.is_free,
          thumbnail_url: course.thumbnail_url,
          trailer_video_id: course.trailer_video_id,
          what_you_learn: (course as { what_you_learn?: string[] }).what_you_learn ?? [],
          requirements: (course as { requirements?: string[] }).requirements ?? [],
          total_duration_seconds: course.total_duration_seconds,
          students_count: course.students_count,
        }}
        modules={modules}
        teacher={teacher}
        category={category}
        categories={categories ?? []}
        bunnyConfigured={bunnyConfigured}
        bunnyLibraryId={bunnyLibraryId}
      />
    </div>
  );
}
