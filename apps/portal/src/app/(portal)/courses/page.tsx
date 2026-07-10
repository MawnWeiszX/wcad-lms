import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { redirect } from 'next/navigation';
import { BookOpen, Plus, Tag } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CoursesTab } from './courses-tab';
import { CategoriesTab } from './categories-tab';

export const metadata: Metadata = { title: 'Mis cursos' };
export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function CoursesListPage({ searchParams }: Props) {
  const { tab = 'courses' } = await searchParams;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`${process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000'}/`);

  // Cargar cursos y categorías en paralelo
  const [{ data: coursesRaw }, { data: categoriesRaw }, { data: allCoursesRaw }] = await Promise.all([
    supabase
      .from('courses')
      .select(`
        id, title, slug, short_description, thumbnail_url,
        price, currency, level, is_published, is_free,
        students_count, total_duration_seconds, created_at,
        category:categories(name)
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name, slug, description').order('name'),
    supabase.from('courses').select('category_id').not('category_id', 'is', null),
  ]);

  // Calcular course_count por categoría
  const courses = (coursesRaw ?? []) as {
    id: string; title: string; slug: string; short_description: string | null;
    thumbnail_url: string | null; price: number; currency: string; level: string;
    is_published: boolean; is_free: boolean; students_count: number;
    total_duration_seconds: number; created_at: string;
    category: { name: string } | { name: string }[] | null;
  }[];

  const allCourses = (allCoursesRaw ?? []) as { category_id: string }[];
  const countMap: Record<string, number> = {};
  for (const c of allCourses) {
    if (c.category_id) countMap[c.category_id] = (countMap[c.category_id] ?? 0) + 1;
  }

  const categories = ((categoriesRaw ?? []) as {
    id: string; name: string; slug: string; description: string | null;
  }[]).map(cat => ({ ...cat, course_count: countMap[cat.id] ?? 0 }));

  const published = courses.filter(c => c.is_published).length;
  const drafts = courses.length - published;
  const usedCats = categories.filter(c => c.course_count > 0).length;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Mis cursos</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {courses.length} curso{courses.length !== 1 ? 's' : ''} · {published} publicados · {drafts} borradores
          </p>
        </div>
        {tab === 'courses' ? (
          <Link
            href="/courses/new"
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[var(--color-primary)]/20 hover:bg-[var(--color-primary-hover)] transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nuevo curso
          </Link>
        ) : (
          <Link
            href="/courses?tab=categories&new=1"
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[var(--color-primary)]/20 hover:bg-[var(--color-primary-hover)] transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nueva categoría
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-sm w-fit">
        <Link
          href="/courses?tab=courses"
          className={[
            'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200',
            tab === 'courses' || tab === ''
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]',
          ].join(' ')}
        >
          <BookOpen className="h-4 w-4" />
          Cursos
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
            tab === 'courses' || tab === '' ? 'bg-white/20 text-white' : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
          }`}>
            {courses.length}
          </span>
        </Link>
        <Link
          href="/courses?tab=categories"
          className={[
            'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200',
            tab === 'categories'
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]',
          ].join(' ')}
        >
          <Tag className="h-4 w-4" />
          Categorías
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
            tab === 'categories' ? 'bg-white/20 text-white' : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
          }`}>
            {categories.length}
          </span>
        </Link>
      </div>

      {/* Contenido del tab activo */}
      {tab === 'categories' ? (
        <CategoriesTab categories={categories} usedCount={usedCats} />
      ) : (
        <CoursesTab courses={courses} published={published} drafts={drafts} />
      )}
    </div>
  );
}
