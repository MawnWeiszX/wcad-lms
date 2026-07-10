/**
 * PREVIEW DEL AULA VIRTUAL (solo desarrollo)
 * Muestra la UI con datos de ejemplo sin necesitar autenticación.
 * Acceder en: http://localhost:3000/preview/learn
 */

import Link from 'next/link';
import {
  GraduationCap,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react';

// ── Mock data ──────────────────────────────────────────────
const MOCK_COURSE = {
  title: 'Desarrollo Web Full-Stack con Next.js',
  slug: 'desarrollo-web-fullstack-nextjs',
};

const MOCK_MODULES = [
  {
    id: 'm1',
    title: 'Módulo 1: Fundamentos de React',
    open: true,
    lessons: [
      { id: 'l1', title: 'Introducción a React y JSX', completed: true, active: false, duration: '12m' },
      { id: 'l2', title: 'Componentes y props', completed: true, active: false, duration: '18m' },
      { id: 'l3', title: 'Estado y efectos con hooks', completed: false, active: true, duration: '24m' },
      { id: 'l4', title: 'Manejo de formularios', completed: false, active: false, duration: '15m' },
    ],
  },
  {
    id: 'm2',
    title: 'Módulo 2: Next.js 15 App Router',
    open: false,
    lessons: [
      { id: 'l5', title: 'Estructura del proyecto', completed: false, active: false, duration: '10m' },
      { id: 'l6', title: 'Server y Client Components', completed: false, active: false, duration: '22m' },
      { id: 'l7', title: 'Rutas dinámicas y layouts', completed: false, active: false, duration: '20m' },
      { id: 'l8', title: 'Data fetching y caché', completed: false, active: false, duration: '30m' },
    ],
  },
  {
    id: 'm3',
    title: 'Módulo 3: Base de datos con Supabase',
    open: false,
    lessons: [
      { id: 'l9', title: 'Configuración de Supabase', completed: false, active: false, duration: '14m' },
      { id: 'l10', title: 'Row Level Security', completed: false, active: false, duration: '28m' },
    ],
  },
];

const ACTIVE_LESSON = MOCK_MODULES[0]!.lessons[2]!;
const completedCount = MOCK_MODULES.flatMap((m) => m.lessons).filter((l) => l.completed).length;
const totalLessons = MOCK_MODULES.flatMap((m) => m.lessons).length;
const progressPercent = Math.round((completedCount / totalLessons) * 100);

export default function PreviewLearn() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--color-surface)]">
      {/* Banner de preview */}
      <div className="shrink-0 bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-900">
        🔍 MODO PREVIEW — Datos de ejemplo. Esta barra no aparece en producción.
      </div>

      {/* Header del aula */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
        <Link
          href="/preview/dashboard"
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Mis cursos
        </Link>

        {/* Barra de progreso central */}
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
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="hidden text-sm font-bold sm:block">WCAD</span>
        </Link>
      </header>

      {/* Cuerpo principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de lecciones */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface-alt)] lg:block">
          <div className="p-4">
            <h2 className="mb-4 text-sm font-semibold text-[var(--color-text)]">
              {MOCK_COURSE.title}
            </h2>

            <div className="space-y-2">
              {MOCK_MODULES.map((module) => (
                <details key={module.id} open={module.open}>
                  <summary className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]">
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[open]_&]:rotate-180" />
                    <span className="flex-1 line-clamp-1">{module.title}</span>
                  </summary>
                  <div className="mt-1 space-y-0.5 pl-3">
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                          lesson.active
                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                        }`}
                      >
                        {lesson.completed ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <Circle className={`h-4 w-4 shrink-0 ${lesson.active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                        )}
                        <span className="flex-1 line-clamp-2">{lesson.title}</span>
                        <span className="shrink-0 text-[var(--color-text-muted)]">{lesson.duration}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </aside>

        {/* Área del video y contenido */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          {/* Placeholder del reproductor */}
          <div className="w-full bg-zinc-950">
            <div className="mx-auto flex aspect-video max-h-[70vh] w-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                  <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-sm text-white/60">
                  Reproductor de video Bunny.net
                </p>
                <p className="mt-1 text-xs text-white/30">
                  URL firmada con HMAC-SHA256
                </p>
              </div>
            </div>
          </div>

          {/* Info de la lección activa */}
          <div className="mx-auto w-full max-w-4xl p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
                  Módulo 1 · Lección 3
                </p>
                <h1 className="text-xl font-bold text-[var(--color-text)] sm:text-2xl">
                  {ACTIVE_LESSON.title}
                </h1>
              </div>

              {/* Botón de completar (simulado) */}
              <button className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]">
                <Circle className="h-4 w-4" />
                Marcar completada
              </button>
            </div>

            {/* Navegación entre lecciones */}
            <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-6">
              <button className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]">
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]">
                Siguiente
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
