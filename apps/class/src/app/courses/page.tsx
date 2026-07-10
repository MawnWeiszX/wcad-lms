import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { CourseCard, EmptyCourses } from '@/components/course-card';
import { Search, SlidersHorizontal, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'Cursos — WCAD',
  description: 'Explora todo el catálogo de cursos de WCAD. Filtra por categoría, nivel y precio.',
};

// ISR: revalidar cada 60 segundos
export const revalidate = 60;

interface SearchParams {
  q?: string;
  category?: string;
  level?: string;
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  const categorySelect = params.category
    ? 'category:categories!inner(name, slug)'
    : 'category:categories(name, slug)';

  // Construir query de cursos con filtros
  let coursesQuery = supabase
    .from('courses')
    .select(`
      id, title, slug, short_description, thumbnail_url,
      price, currency, level, total_duration_seconds, students_count,
      teacher:profiles!courses_teacher_id_fkey(full_name),
      ${categorySelect}
    `)
    .eq('is_published', true)
    .order('students_count', { ascending: false });

  if (params.q) {
    coursesQuery = coursesQuery.ilike('title', `%${params.q}%`);
  }
  if (params.category) {
    interface QueryBuilderLoose {
      eq(col: string, val: unknown): QueryBuilderLoose;
    }
    coursesQuery = (coursesQuery as unknown as QueryBuilderLoose).eq('category.slug', params.category) as typeof coursesQuery;
  }
  if (params.level) {
    coursesQuery = coursesQuery.eq('level', params.level);
  }

  // Ejecutar todas las queries en paralelo
  const [{ data: categoriesData }, { data: coursesData }, { data: { user } }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    coursesQuery,
    supabase.auth.getUser(),
  ]);

  const categories = (categoriesData ?? []) as { id: string; name: string; slug: string }[];

  // Profile depende del auth result
  let profile = null;
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, role')
      .eq('id', user.id)
      .single();
    profile = profileData as { full_name: string | null; avatar_url: string | null; role: string } | null;
  }

  const userInfo = user ? {
    email: user.email ?? '',
    name: profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    role: profile?.role ?? 'student',
  } : null;

  interface StudentCourse {
    id: string;
    title: string;
    slug: string;
    short_description: string | null;
    thumbnail_url: string | null;
    price: number;
    currency: string;
    level: string;
    total_duration_seconds: number;
    students_count: number;
    teacher: { full_name: string | null } | { full_name: string | null }[] | null;
    category: { name: string } | { name: string }[] | null;
  }
  const courses = (coursesData ?? []) as unknown as StudentCourse[];

  const levels = [
    { value: 'beginner', label: 'Principiante' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzado' },
  ];

  const content = (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-3">
          <Link href="/" className="hover:text-[var(--color-text)]">Inicio</Link>
          <ChevronRight className="h-4 w-4" />
          <span>Cursos</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
          Catálogo de cursos
        </h1>
        <p className="mt-3 text-lg text-[var(--color-text-secondary)]">
          {courses?.length ?? 0} cursos disponibles para impulsar tu career.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar de filtros */}
        <aside className="w-full lg:w-64 shrink-0">
          <form className="sticky top-24 space-y-6">
            {/* Buscador */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  name="q"
                  defaultValue={params.q}
                  placeholder="Título del curso..."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
            </div>

            {/* Filtro por nivel */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                Nivel
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="level"
                    value=""
                    defaultChecked={!params.level}
                    className="accent-[var(--color-primary)]"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)]">Todos</span>
                </label>
                {levels.map((level) => (
                  <label key={level.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="level"
                      value={level.value}
                      defaultChecked={params.level === level.value}
                      className="accent-[var(--color-primary)]"
                    />
                    <span className="text-sm text-[var(--color-text-secondary)]">{level.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro por categoría */}
            {categories && categories.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  Categoría
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      defaultChecked={!params.category}
                      className="accent-[var(--color-primary)]"
                    />
                    <span className="text-sm text-[var(--color-text-secondary)]">Todas</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat.slug}
                        defaultChecked={params.category === cat.slug}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="text-sm text-[var(--color-text-secondary)]">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Botón aplicar */}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Aplicar filtros
            </button>

            {(params.q || params.level || params.category) && (
              <Link
                href="/courses"
                className="block text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Limpiar filtros
              </Link>
            )}
          </form>
        </aside>

        {/* Grid de cursos */}
        <main className="flex-1">
          {!courses || courses.length === 0 ? (
            <EmptyCourses />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={{
                    ...course,
                    teacher: Array.isArray(course.teacher) ? course.teacher[0] : course.teacher,
                    category: Array.isArray(course.category) ? course.category[0] : course.category,
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-surface)] pt-16">
      <Navbar user={userInfo} />
      {content}
    </div>
  );
}
