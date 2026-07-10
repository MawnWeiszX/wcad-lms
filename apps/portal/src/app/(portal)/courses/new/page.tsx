import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewCoursePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`${process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000'}/`);

  const slugSuffix = Math.random().toString(36).substring(2, 7);
  const draftTitle = 'Nuevo Curso';
  const draftSlug = `nuevo-curso-${slugSuffix}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: course, error } = await (supabase.from('courses') as any)
    .insert({
      title: draftTitle,
      slug: draftSlug,
      teacher_id: user.id,
      price: 0,
      currency: 'USD',
      level: 'beginner',
      is_published: false,
      is_free: true,
    })
    .select('id')
    .single();

  if (error || !course) {
    console.error('Error creating draft course:', error);
    redirect('/courses');
  }

  redirect(`/courses/${course.id}`);
}
