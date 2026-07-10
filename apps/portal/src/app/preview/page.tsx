/**
 * PREVIEW DEL PORTAL (solo desarrollo)
 * http://localhost:3001/preview
 */
import Link from 'next/link';
import {
  GraduationCap, LayoutDashboard, BookOpen, Users,
  BarChart3, Settings, Plus, DollarSign, TrendingUp,
  ChevronRight
} from 'lucide-react';

const MOCK_COURSES = [
  { id: '1', title: 'Desarrollo Web Full-Stack con Next.js', students: 1284, price: 49.99, published: true, level: 'Intermedio', category: 'Desarrollo Web' },
  { id: '2', title: 'Diseño UX/UI: De Cero a Profesional', students: 892, price: 39.99, published: true, level: 'Principiante', category: 'Diseño' },
  { id: '3', title: 'Python para Ciencia de Datos', students: 0, price: 44.99, published: false, level: 'Intermedio', category: 'Datos' },
];

const MOCK_ENROLLMENTS = [
  { id: '1', student: 'Ana García', course: 'Desarrollo Web Full-Stack', time: 'Hace 2h' },
  { id: '2', student: 'Luis Mendoza', course: 'Diseño UX/UI', time: 'Hace 5h' },
  { id: '3', student: 'María Torres', course: 'Desarrollo Web Full-Stack', time: 'Ayer' },
  { id: '4', student: 'Carlos Ruiz', course: 'Diseño UX/UI', time: 'Ayer' },
];

const NAV = [
  { href: '/preview', icon: LayoutDashboard, label: 'Panel', active: true },
  { href: '/preview/courses', icon: BookOpen, label: 'Mis cursos', active: false },
  { href: '#', icon: Users, label: 'Estudiantes', active: false },
  { href: '#', icon: BarChart3, label: 'Estadísticas', active: false },
  { href: '#', icon: Settings, label: 'Configuración', active: false },
];

function StatCard({ icon: Icon, label, value, sub, colorClass }: { icon: React.ElementType; label: string; value: string; sub: string; colorClass: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-text)]">{value}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{sub}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default function PortalPreview() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-alt)]">
      {/* Sidebar oscuro */}
      <aside className="flex w-64 shrink-0 flex-col bg-[#0f172a] text-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold">WCAD</span>
          <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/60">Portal</span>
        </div>

        {/* Botón nuevo curso */}
        <div className="px-4 pt-5">
          <Link href="/preview/courses/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]">
            <Plus className="h-4 w-4" />
            Nuevo curso
          </Link>
        </div>

        {/* Nav */}
        <nav className="mt-5 flex-1 space-y-1 px-3">
          {NAV.map(({ href, icon: Icon, label, active }) => (
            <Link key={label} href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active ? 'bg-[var(--color-primary)] text-white' : 'text-[#94a3b8] hover:bg-white/8 hover:text-white'
              }`}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Perfil */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/30 text-sm font-bold">C</div>
            <div>
              <p className="text-sm font-medium">Carlos Mendoza</p>
              <p className="text-xs text-white/40">teacher</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Banner */}
        <div className="mb-6 rounded-xl bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          🔍 MODO PREVIEW — Datos de ejemplo. Accede a /preview/courses para ver la lista de cursos.
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Buen día, Carlos 👋</h1>
            <p className="mt-1 text-[var(--color-text-secondary)]">Aquí está el resumen de tu actividad.</p>
          </div>

          {/* Stats */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={BookOpen} label="Cursos publicados" value="2" sub="3 en total" colorClass="bg-indigo-50 text-indigo-600" />
            <StatCard icon={Users} label="Estudiantes totales" value="2,176" sub="en todos tus cursos" colorClass="bg-emerald-50 text-emerald-600" />
            <StatCard icon={DollarSign} label="Ingresos totales" value="$4,820" sub="transacciones aprobadas" colorClass="bg-amber-50 text-amber-600" />
            <StatCard icon={TrendingUp} label="Tasa de publicación" value="67%" sub="2 de 3 cursos" colorClass="bg-violet-50 text-violet-600" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Mis cursos */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-white">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
                <h2 className="font-semibold text-[var(--color-text)]">Mis cursos</h2>
                <Link href="/preview/courses" className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">
                  Ver todos <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {MOCK_COURSES.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--color-surface-alt)]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-alt)]">
                      <BookOpen className="h-5 w-5 text-[var(--color-text-muted)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-text)]">{c.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{c.students} estudiantes · ${c.price}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {c.published ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Últimas inscripciones */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-white">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
                <h2 className="font-semibold text-[var(--color-text)]">Últimas inscripciones</h2>
                <span className="text-xs text-[var(--color-text-muted)]">Ver todas</span>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {MOCK_ENROLLMENTS.map((e) => (
                  <div key={e.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
                      {e.student.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text)]">{e.student}</p>
                      <p className="truncate text-xs text-[var(--color-text-muted)]">{e.course}</p>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">{e.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
