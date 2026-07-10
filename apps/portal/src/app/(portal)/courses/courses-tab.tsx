import { BookOpen, Plus, Users, Eye, Pencil, Globe, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface CourseListItem {
  id: string; title: string; slug: string; short_description: string | null;
  thumbnail_url: string | null; price: number; currency: string; level: string;
  is_published: boolean; is_free: boolean; students_count: number;
  total_duration_seconds: number; created_at: string;
  category: { name: string } | { name: string }[] | null;
}

function formatLevel(level: string) {
  return { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }[level] ?? level;
}

export function CoursesTab({ courses }: {
  courses: CourseListItem[];
  published: number;
  drafts: number;
}) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-alt)]">
          <BookOpen className="h-8 w-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text)]">Crea tu primer curso</h3>
        <p className="mt-2 mb-6 max-w-sm text-sm text-[var(--color-text-secondary)]">
          Comparte tu conocimiento con estudiantes de toda Latinoamérica.
        </p>
        <Link
          href="/courses/new"
          className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
        >
          <Plus className="h-4 w-4" />
          Crear curso
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      {/* Header de tabla */}
      <div className="grid grid-cols-12 gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <div className="col-span-5">Curso</div>
        <div className="col-span-2 text-center">Estudiantes</div>
        <div className="col-span-2 text-center">Precio</div>
        <div className="col-span-1 text-center">Estado</div>
        <div className="col-span-2 text-center">Acciones</div>
      </div>

      <div className="divide-y divide-[var(--color-border)]">
        {courses.map((course) => {
          const category = Array.isArray(course.category) ? course.category[0] : course.category;
          return (
            <div
              key={course.id}
              className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-[var(--color-surface-alt)]"
            >
              {/* Título y detalles */}
              <div className="col-span-5 flex items-center gap-4">
                <div className="relative flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                  {course.thumbnail_url ? (
                    <Image src={course.thumbnail_url} alt="" fill className="object-cover" />
                  ) : (
                    <BookOpen className="h-5 w-5 text-[var(--color-text-muted)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--color-text)]">{course.title}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    {category && <span className="rounded-full bg-[var(--color-accent-bg)] px-2 py-0.5 text-[var(--color-primary)]">{category.name}</span>}
                    <span>{formatLevel(course.level)}</span>
                  </div>
                </div>
              </div>

              {/* Estudiantes */}
              <div className="col-span-2 flex items-center justify-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
                {course.students_count.toLocaleString()}
              </div>

              {/* Precio */}
              <div className="col-span-2 text-center text-sm font-semibold text-[var(--color-text)]">
                {course.is_free || course.price === 0
                  ? <span className="text-emerald-600">Gratis</span>
                  : `S/ ${Number(course.price || 0).toFixed(2)}`}
              </div>

              {/* Estado */}
              <div className="col-span-1 flex justify-center">
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                  course.is_published
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-[var(--color-amber-bg)] text-[var(--color-amber-text)] border-[var(--color-amber-border)]'
                }`}>
                  {course.is_published
                    ? <><Globe className="h-3 w-3" /> Publicado</>
                    : <><Lock className="h-3 w-3" /> Borrador</>}
                </span>
              </div>

              {/* Acciones */}
              <div className="col-span-2 flex items-center justify-center gap-2">
                <Link
                  href={`/courses/${course.id}`}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-accent-bg)] hover:text-[var(--color-primary)] transition-all"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Link>
                <a
                  href={`${process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000'}/courses/${course.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
