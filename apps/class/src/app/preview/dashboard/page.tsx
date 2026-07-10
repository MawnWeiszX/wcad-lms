/**
 * PREVIEW DEL DASHBOARD (solo desarrollo)
 * Muestra la UI con datos de ejemplo sin necesitar autenticación.
 * Acceder en: http://localhost:3000/preview/dashboard
 */

import Link from 'next/link';
import {
  BookOpen,
  Clock,
  TrendingUp,
  GraduationCap,
  Play,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

// ── Mock data ──────────────────────────────────────────────
const MOCK_PROFILE = { fullName: 'Carlos García', avatarUrl: null };

const MOCK_ENROLLMENTS = [
  {
    id: '1',
    title: 'Desarrollo Web Full-Stack con Next.js',
    slug: 'desarrollo-web-fullstack-nextjs',
    thumbnailUrl: null,
    progressPercent: 65,
    completedLessons: 13,
    totalLessons: 20,
    totalDurationSeconds: 36000,
  },
  {
    id: '2',
    title: 'Diseño UX/UI: De Cero a Profesional',
    slug: 'diseno-ux-ui-profesional',
    thumbnailUrl: null,
    progressPercent: 100,
    completedLessons: 18,
    totalLessons: 18,
    totalDurationSeconds: 28800,
  },
  {
    id: '3',
    title: 'Marketing Digital para Emprendedores',
    slug: 'marketing-digital-emprendedores',
    thumbnailUrl: null,
    progressPercent: 0,
    completedLessons: 0,
    totalLessons: 12,
    totalDurationSeconds: 21600,
  },
];

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
      <div
        className="h-full rounded-full bg-[var(--color-primary)] transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function PreviewDashboard() {
  const firstName = MOCK_PROFILE.fullName.split(' ')[0];
  const totalCourses = MOCK_ENROLLMENTS.length;
  const completedCourses = MOCK_ENROLLMENTS.filter((e) => e.progressPercent === 100).length;
  const inProgress = MOCK_ENROLLMENTS.filter(
    (e) => e.progressPercent > 0 && e.progressPercent < 100
  ).length;

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Banner de preview */}
      <div className="sticky top-0 z-50 bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-amber-900">
        🔍 MODO PREVIEW — Datos de ejemplo. Esta barra no aparece en producción.
      </div>

      {/* Navbar */}
      <nav className="sticky top-9 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">WCAD</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/courses"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            >
              Explorar
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-bold text-[var(--color-primary)]">
              {firstName.charAt(0)}
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Saludo */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
            ¡Hola, {firstName}! 👋
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Aquí está tu resumen de aprendizaje.
          </p>
        </div>

        {/* Stats rápidas */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: BookOpen, label: 'Cursos inscritos', value: totalCourses, color: 'text-[var(--color-primary)]' },
            { icon: TrendingUp, label: 'En progreso', value: inProgress, color: 'text-amber-500' },
            { icon: GraduationCap, label: 'Completados', value: completedCourses, color: 'text-emerald-500' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-alt)] ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text)]">{stat.value}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mis cursos */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">Mis cursos</h2>
            <Link
              href="/courses"
              className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
            >
              Explorar más
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_ENROLLMENTS.map((enrollment) => (
              <div
                key={enrollment.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-all hover:shadow-lg"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-[var(--color-surface-alt)]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {enrollment.progressPercent === 100 ? (
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    ) : (
                      <Play className="h-10 w-10 text-[var(--color-text-muted)]" />
                    )}
                  </div>
                  {/* Badge de progreso */}
                  <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-sm ${
                    enrollment.progressPercent === 100
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-[var(--color-surface)]/90 text-[var(--color-primary)]'
                  }`}>
                    {enrollment.progressPercent === 100 ? '✓ Completado' : `${enrollment.progressPercent}%`}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="line-clamp-2 font-semibold text-[var(--color-text)]">
                    {enrollment.title}
                  </h3>

                  {/* Duración */}
                  <div className="mt-2 flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                    <Clock className="h-3.5 w-3.5" />
                    {Math.floor(enrollment.totalDurationSeconds / 3600)}h de contenido
                  </div>

                  {/* Progreso */}
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                      <span>{enrollment.completedLessons} de {enrollment.totalLessons} lecciones</span>
                      <span>{enrollment.progressPercent}%</span>
                    </div>
                    <ProgressBar value={enrollment.progressPercent} />
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/preview/learn`}
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[var(--color-primary)] py-2.5 text-sm font-semibold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)] hover:text-white"
                  >
                    <Play className="h-4 w-4" />
                    {enrollment.progressPercent === 0
                      ? 'Comenzar'
                      : enrollment.progressPercent === 100
                      ? 'Repasar'
                      : 'Continuar'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
