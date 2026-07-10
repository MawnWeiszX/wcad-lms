/**
 * PREVIEW — Formulario de nuevo curso
 * http://localhost:3001/preview/courses/new
 */
import Link from 'next/link';
import {
  GraduationCap, LayoutDashboard, BookOpen, Users,
  BarChart3, Settings, Plus, ChevronLeft, Globe,
} from 'lucide-react';

const NAV = [
  { href: '/preview', icon: LayoutDashboard, label: 'Panel', active: false },
  { href: '/preview/courses', icon: BookOpen, label: 'Mis cursos', active: true },
  { href: '#', icon: Users, label: 'Estudiantes', active: false },
  { href: '#', icon: BarChart3, label: 'Estadísticas', active: false },
  { href: '#', icon: Settings, label: 'Configuración', active: false },
];

function SidebarPreview() {
  return (
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
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? 'bg-[var(--color-primary)] text-white' : 'text-[#94a3b8] hover:text-white'}`}>
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
  );
}

export default function PreviewNewCourse() {
  const inputClass = 'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20';
  const labelClass = 'mb-1.5 block text-sm font-medium text-[var(--color-text)]';

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-alt)]">
      <SidebarPreview />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-4 rounded-xl bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          🔍 MODO PREVIEW — Datos de ejemplo.
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <Link href="/preview/courses" className="mb-3 flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
              <ChevronLeft className="h-4 w-4" /> Mis cursos
            </Link>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Crear nuevo curso</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Completa la información básica. Podrás agregar módulos y lecciones después.</p>
          </div>

          {/* Info básica */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 space-y-4">
            <h2 className="font-semibold text-[var(--color-text)]">Información básica</h2>
            <div>
              <label className={labelClass}>Título del curso *</label>
              <input type="text" className={inputClass} placeholder="Ej: Desarrollo Web con Next.js 15" defaultValue="Mi nuevo curso" />
            </div>
            <div>
              <label className={labelClass}>Slug (URL) — wcadservice.com/courses/<strong>mi-nuevo-curso</strong></label>
              <input type="text" className={inputClass} defaultValue="mi-nuevo-curso" />
            </div>
            <div>
              <label className={labelClass}>Descripción corta</label>
              <textarea rows={2} className={`${inputClass} resize-none`} placeholder="Resumen del curso..." />
            </div>
            <div>
              <label className={labelClass}>Descripción completa</label>
              <textarea rows={6} className={`${inputClass} resize-none`} placeholder="Describe en detalle qué aprenderán..." />
            </div>
          </div>

          {/* Configuración */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 space-y-4">
            <h2 className="font-semibold text-[var(--color-text)]">Configuración</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Categoría</label>
                <select className={inputClass}><option>Desarrollo Web</option><option>Diseño</option><option>Marketing</option></select>
              </div>
              <div>
                <label className={labelClass}>Nivel</label>
                <select className={inputClass}><option>Principiante</option><option>Intermedio</option><option>Avanzado</option></select>
              </div>
              <div>
                <label className={labelClass}>Moneda</label>
                <select className={inputClass}><option>USD — Dólares</option><option>MXN — Pesos mexicanos</option></select>
              </div>
              <div>
                <label className={labelClass}>Precio</label>
                <input type="number" className={inputClass} defaultValue="49.99" />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-3 mt-2">
              <div className="relative">
                <div className="h-6 w-11 rounded-full bg-[var(--color-border)]">
                  <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow" />
                </div>
              </div>
              <span className="text-sm font-medium text-[var(--color-text)]">Curso gratuito</span>
            </label>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]">
              Guardar borrador
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]">
              <Globe className="h-4 w-4" /> Publicar curso
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
