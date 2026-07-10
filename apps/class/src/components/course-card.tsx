import Link from 'next/link';
import Image from 'next/image';
import { Clock, Users, Play, GraduationCap } from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────
interface CourseCardProps {
  course: {
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
    teacher: { full_name: string | null } | null;
    category: { name: string } | null;
  };
}

// ── Helpers ────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
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

function formatStudents(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

// ── Componente ─────────────────────────────────────────────
export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.slug}`}>
      <article className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-xl hover:shadow-[var(--color-primary)]/5">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-[var(--color-surface-alt)]">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-all group-hover:scale-110 group-hover:bg-[var(--color-primary)]/20">
                <Play className="ml-0.5 h-6 w-6" />
              </div>
            </div>
          )}
          {/* Categoría */}
          {course.category && (
            <span className="absolute left-3 top-3 rounded-md bg-[var(--color-surface)]/90 px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)] backdrop-blur-sm">
              {course.category.name}
            </span>
          )}
          {/* Nivel */}
          <span className="absolute right-3 top-3 rounded-md bg-[var(--color-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-primary)]">
            {formatLevel(course.level)}
          </span>
        </div>

        {/* Contenido */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
            {course.title}
          </h3>
          {course.short_description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {course.short_description}
            </p>
          )}

          {/* Profesor */}
          {course.teacher && (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
                {(course.teacher.full_name ?? 'P').charAt(0)}
              </div>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {course.teacher.full_name ?? 'Profesor'}
              </span>
            </div>
          )}

          {/* Meta */}
          <div className="mt-4 flex items-center gap-4 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(course.total_duration_seconds)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {formatStudents(course.students_count)}
            </span>
            <span className="ml-auto text-lg font-bold text-[var(--color-text)]">
              {course.price === 0 ? 'Gratis' : `S/ ${Number(course.price).toFixed(2)}`}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ── Skeleton de carga ──────────────────────────────────────
export function CourseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="aspect-video animate-pulse bg-[var(--color-surface-alt)]" />
      <div className="flex flex-col gap-3 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-surface-alt)]" />
        <div className="h-3 w-full animate-pulse rounded bg-[var(--color-surface-alt)]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--color-surface-alt)]" />
        <div className="mt-2 flex items-center gap-2">
          <div className="h-7 w-7 animate-pulse rounded-full bg-[var(--color-surface-alt)]" />
          <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-surface-alt)]" />
        </div>
      </div>
    </div>
  );
}

// ── Componente vacío ───────────────────────────────────────
export function EmptyCourses() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-alt)]">
        <GraduationCap className="h-8 w-8 text-[var(--color-text-muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text)]">
        No hay cursos disponibles
      </h3>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Vuelve pronto, estamos agregando nuevos cursos.
      </p>
    </div>
  );
}
