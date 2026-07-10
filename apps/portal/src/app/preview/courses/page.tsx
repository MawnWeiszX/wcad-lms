/**
 * PREVIEW — Lista de cursos del portal
 * http://localhost:3001/preview/courses
 */
import Link from 'next/link';
import { GraduationCap, LayoutDashboard, BookOpen, Users, BarChart3, Settings, Plus, Eye, Pencil, Globe, Lock } from 'lucide-react';

const MOCK_COURSES = [
  { id: '1', title: 'Desarrollo Web Full-Stack con Next.js', category: 'Desarrollo Web', level: 'Intermedio', students: 1284, price: 49.99, published: true, duration: '10h' },
  { id: '2', title: 'Diseño UX/UI: De Cero a Profesional', category: 'Diseño', level: 'Principiante', students: 892, price: 39.99, published: true, duration: '8h' },
  { id: '3', title: 'Python para Ciencia de Datos', category: 'Datos', level: 'Intermedio', students: 0, price: 44.99, published: false, duration: '9h' },
];

const NAV = [
  { href: '/preview', icon: LayoutDashboard, label: 'Panel', active: false },
  { href: '/preview/courses', icon: BookOpen, label: 'Mis cursos', active: true },
  { href: '#', icon: Users, label: 'Estudiantes', active: false },
  { href: '#', icon: BarChart3, label: 'Estadísticas', active: false },
  { href: '#', icon: Settings, label: 'Configuración', active: false },
];

export default function PreviewCourses() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-alt)]">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col bg-[#0f172a] text-white">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold">WCAD</span>
          <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/60">Portal</span>
        </div>
        <div className="px-4 pt-5">
          <Link href="/preview/courses/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]">
            <Plus className="h-4 w-4" /> Nuevo curso
          </Link>
        </div>
        <nav className="mt-5 flex-1 space-y-1 px-3">
          {NAV.map(({ href, icon: Icon, label, active }) => (
            <Link key={label} href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? 'bg-[var(--color-primary)] text-white' : 'text-[#94a3b8] hover:bg-white/8 hover:text-white'}`}>
              <Icon className="h-4 w-4 shrink-0" /> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/30 text-sm font-bold">C</div>
            <div><p className="text-sm font-medium">Carlos Mendoza</p><p className="text-xs text-white/40">teacher</p></div>
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 rounded-xl bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          🔍 MODO PREVIEW — Datos de ejemplo. Esta barra no aparece en producción.
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">Mis cursos</h1>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">2 publicados · 1 en borrador</p>
            </div>
            <Link href="/preview/courses/new"
              className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]">
              <Plus className="h-4 w-4" /> Nuevo curso
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              <div className="col-span-5">Curso</div>
              <div className="col-span-2 text-center">Estudiantes</div>
              <div className="col-span-2 text-center">Precio</div>
              <div className="col-span-1 text-center">Estado</div>
              <div className="col-span-2 text-center">Acciones</div>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {MOCK_COURSES.map((course) => (
                <div key={course.id} className="grid grid-cols-12 items-center gap-4 px-6 py-4 hover:bg-[var(--color-surface-alt)]">
                  <div className="col-span-5 flex items-center gap-4">
                    <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-alt)]">
                      <BookOpen className="h-5 w-5 text-[var(--color-text-muted)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--color-text)]">{course.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{course.category} · {course.level}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center text-sm text-[var(--color-text-secondary)]">
                    {course.students.toLocaleString()}
                  </div>
                  <div className="col-span-2 text-center text-sm font-semibold text-[var(--color-text)]">
                    ${course.price}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${course.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {course.published ? <><Globe className="h-3 w-3" /> Publicado</> : <><Lock className="h-3 w-3" /> Borrador</>}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <Link href={`/preview/courses/${course.id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-accent-bg)] hover:text-[var(--color-primary)]">
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </Link>
                    <button className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
