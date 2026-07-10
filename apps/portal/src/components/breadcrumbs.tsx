'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  courses: 'Cursos',
  students: 'Estudiantes',
  analytics: 'Analítica',
  settings: 'Ajustes',
  categories: 'Categorías',
  lessons: 'Lecciones',
  new: 'Nuevo curso',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = LABELS[seg] ?? (seg.length > 20 ? seg.slice(0, 8) + '...' : seg);
    const isLast = i === segments.length - 1;

    return (
      <li key={href} className="flex items-center gap-1.5">
        {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />}
        {isLast ? (
          <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
        ) : (
          <Link
            href={href}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            {label}
          </Link>
        )}
      </li>
    );
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5">
        <li className="flex items-center gap-1.5">
          <Link href="/dashboard" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {crumbs.map(c => c)}
      </ol>
    </nav>
  );
}
