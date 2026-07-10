/**
 * PREVIEW — Editor de curso (WYSIWYG)
 * http://localhost:3001/preview/courses/editor
 */
'use client';

import { useState } from 'react';
import {
  GraduationCap, LayoutDashboard, BookOpen, Users, BarChart3,
  Settings, Plus, ChevronLeft, ChevronDown, GripVertical,
  Play, Globe, Lock, Clock, Award, CheckCircle2, Circle,
  Trash2, Save, Eye, Pencil, Upload, Info,
} from 'lucide-react';
import Link from 'next/link';

// ── Sidebar ──────────────────────────────────────────────────
const NAV = [
  { href: '/preview', icon: LayoutDashboard, label: 'Panel' },
  { href: '/preview/courses', icon: BookOpen, label: 'Mis cursos' },
  { href: '#', icon: Users, label: 'Estudiantes' },
  { href: '#', icon: BarChart3, label: 'Estadísticas' },
  { href: '#', icon: Settings, label: 'Configuración' },
];

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-[#0f172a] text-white xl:flex">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="text-base font-bold">WCAD</span>
        <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/60">Portal</span>
      </div>
      <div className="px-4 pt-5">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" /> Nuevo curso
        </button>
      </div>
      <nav className="mt-5 flex-1 space-y-1 px-3">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={label} href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
              label === 'Mis cursos' ? 'bg-[var(--color-primary)] text-white' : 'text-[#94a3b8] hover:text-white'
            }`}>
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

// ── Mock data ─────────────────────────────────────────────────
const INIT_MODULES = [
  {
    id: 'm1', title: 'Módulo 1: Fundamentos de React', open: true,
    lessons: [
      { id: 'l1', title: 'Introducción a React y JSX', free: true, duration: '12m', hasVideo: true },
      { id: 'l2', title: 'Componentes y props', free: false, duration: '18m', hasVideo: true },
      { id: 'l3', title: 'Estado y efectos con hooks', free: false, duration: '24m', hasVideo: false },
    ],
  },
  {
    id: 'm2', title: 'Módulo 2: Next.js 15 App Router', open: false,
    lessons: [
      { id: 'l4', title: 'Estructura del proyecto', free: false, duration: '10m', hasVideo: false },
      { id: 'l5', title: 'Server y Client Components', free: false, duration: '22m', hasVideo: false },
    ],
  },
];

const LEARN_ITEMS = [
  'Construir aplicaciones Full-Stack con Next.js 15',
  'Usar TypeScript para código más robusto y mantenible',
  'Manejar bases de datos con Supabase y Row Level Security',
  'Desplegar aplicaciones en producción con Vercel',
];

// ── Componente principal ──────────────────────────────────────
export default function PreviewCourseEditor() {
  const [title, setTitle] = useState('Desarrollo Web Full-Stack con Next.js');
  const [shortDesc, setShortDesc] = useState('Domina el desarrollo moderno con React, Next.js 15, TypeScript y bases de datos.');
  const [description, setDescription] = useState('En este curso aprenderás a construir aplicaciones web modernas desde cero. Comenzaremos con los fundamentos de React y progresaremos hacia características avanzadas de Next.js 15 como Server Components, Server Actions y el App Router.');
  const [price, setPrice] = useState('49.99');
  const [currency, setCurrency] = useState('USD');
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [learnItems, setLearnItems] = useState(LEARN_ITEMS);
  const [modules, setModules] = useState(INIT_MODULES);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonTitles, setNewLessonTitles] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);

  function mockSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function addModule() {
    if (!newModuleTitle.trim()) return;
    setModules((p) => [...p, { id: `m${Date.now()}`, title: newModuleTitle, open: true, lessons: [] }]);
    setNewModuleTitle('');
  }

  function addLesson(moduleId: string) {
    const title = newLessonTitles[moduleId]?.trim();
    if (!title) return;
    setModules((p) => p.map((m) => m.id === moduleId
      ? { ...m, lessons: [...m.lessons, { id: `l${Date.now()}`, title, free: false, duration: '', hasVideo: false }] }
      : m
    ));
    setNewLessonTitles((p) => ({ ...p, [moduleId]: '' }));
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-alt)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Banner */}
        <div className="mb-5 rounded-xl bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          🔍 MODO PREVIEW — Editor WYSIWYG. Haz clic en cualquier campo para editarlo.
        </div>

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <Link href="/preview/courses" className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
            <ChevronLeft className="h-4 w-4" /> Mis cursos
          </Link>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {isPublished ? 'Publicado' : 'Borrador'}
            </span>
            <button className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]">
              Ver página pública ↗
            </button>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid gap-8 xl:grid-cols-3">
          {/* ── Columna izquierda ── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Badges de categoría y nivel */}
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-accent-bg)] px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                Desarrollo Web
              </span>
              <span className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Intermedio
              </span>
            </div>

            {/* Título editable */}
            <div className="group relative">
              <Pencil className="absolute right-2 top-2 h-3.5 w-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <textarea
                value={title} rows={2}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full resize-none rounded-xl border-2 border-transparent bg-transparent text-3xl font-bold text-[var(--color-text)] leading-tight focus:border-[var(--color-primary)]/30 focus:bg-white focus:outline-none focus:px-3 focus:py-2 transition-all"
              />
            </div>

            {/* Descripción corta editable */}
            <div className="group relative">
              <Pencil className="absolute right-2 top-2 h-3.5 w-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <textarea
                value={shortDesc} rows={2}
                onChange={(e) => setShortDesc(e.target.value)}
                className="w-full resize-none rounded-xl border-2 border-transparent bg-transparent text-lg text-[var(--color-text-secondary)] leading-relaxed focus:border-[var(--color-primary)]/30 focus:bg-white focus:outline-none focus:px-3 focus:py-2 transition-all"
              />
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-5 border-y border-[var(--color-border)] py-4 text-sm text-[var(--color-text-secondary)]">
              <span className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4" />Intermedio</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />10h de contenido</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />1,284 estudiantes</span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{totalLessons} lecciones</span>
            </div>

            {/* Lo que aprenderás */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <h2 className="mb-4 text-xl font-bold text-[var(--color-text)]">Lo que aprenderás</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {learnItems.map((item, idx) => (
                  <div key={idx} className="group flex items-start gap-2.5">
                    <CheckCircle2 className="mt-2.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                    <input
                      type="text" value={item}
                      onChange={(e) => {
                        const arr = [...learnItems]; arr[idx] = e.target.value; setLearnItems(arr);
                      }}
                      className="flex-1 rounded-lg border-2 border-transparent bg-transparent py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/30 focus:bg-[var(--color-surface-alt)] focus:px-2 focus:outline-none transition-all"
                    />
                    <button onClick={() => setLearnItems((p) => p.filter((_, i) => i !== idx))}
                      className="mt-2 opacity-0 group-hover:opacity-100 shrink-0 rounded p-1 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500 transition-opacity">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => setLearnItems((p) => [...p, ''])}
                className="mt-4 flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
                <Plus className="h-4 w-4" /> Agregar objetivo
              </button>
            </div>

            {/* Este curso incluye */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <h2 className="mb-4 text-xl font-bold text-[var(--color-text)]">Este curso incluye</h2>
              <div className="grid gap-3 sm:grid-cols-2 text-sm text-[var(--color-text-secondary)]">
                {[
                  { icon: Clock, text: '10h de contenido en video' },
                  { icon: BookOpen, text: `${totalLessons} lecciones` },
                  { icon: Award, text: 'Acceso de por vida' },
                  { icon: Award, text: 'Certificado de finalización' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contenido del curso */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--color-text)]">Contenido del curso</h2>
                <span className="text-sm text-[var(--color-text-muted)]">{modules.length} secciones · {totalLessons} lecciones</span>
              </div>
              <div className="space-y-2">
                {modules.map((module) => (
                  <details key={module.id} open={module.open} className="overflow-hidden rounded-xl border border-[var(--color-border)]">
                    <summary className="flex cursor-pointer list-none items-center gap-3 bg-[var(--color-surface-alt)] px-4 py-3.5">
                      <GripVertical className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                      <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform [[open]_&]:rotate-180" />
                      <span className="flex-1 text-sm font-semibold text-[var(--color-text)]">{module.title}</span>
                      <span className="shrink-0 text-xs text-[var(--color-text-muted)]">{module.lessons.length} lecciones</span>
                      <button onClick={(e) => { e.preventDefault(); setModules((p) => p.filter((m) => m.id !== module.id)); }}
                        className="shrink-0 rounded p-1 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </summary>
                    <div className="divide-y divide-[var(--color-border)]">
                      {module.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--color-surface-alt)]">
                          <GripVertical className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                          {lesson.hasVideo
                            ? <Play className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                            : <Circle className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />}
                          <span className="flex-1 text-sm text-[var(--color-text-secondary)]">{lesson.title}</span>
                          {lesson.free && (
                            <span className="rounded bg-[var(--color-accent-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">Gratis</span>
                          )}
                          {lesson.duration && (
                            <span className="shrink-0 text-xs text-[var(--color-text-muted)]">{lesson.duration}</span>
                          )}
                          <button onClick={() => setModules((p) => p.map((m) => m.id === module.id
                            ? { ...m, lessons: m.lessons.filter((l) => l.id !== lesson.id) } : m))}
                            className="shrink-0 rounded p-1 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {/* Agregar lección */}
                      <div className="flex items-center gap-2 bg-[var(--color-surface-alt)]/50 px-5 py-2.5">
                        <input type="text" placeholder="+ Agregar lección..."
                          value={newLessonTitles[module.id] ?? ''}
                          onChange={(e) => setNewLessonTitles((p) => ({ ...p, [module.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') addLesson(module.id); }}
                          className="flex-1 bg-transparent text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none" />
                        <button onClick={() => addLesson(module.id)}
                          className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20">
                          <Plus className="h-3.5 w-3.5" /> Agregar
                        </button>
                      </div>
                    </div>
                  </details>
                ))}

                {/* Agregar sección */}
                <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border)] px-4 py-3">
                  <Plus className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                  <input type="text" placeholder="Agregar sección..."
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addModule(); }}
                    className="flex-1 bg-transparent text-sm font-medium placeholder:text-[var(--color-text-muted)] focus:outline-none" />
                  <button onClick={addModule}
                    className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)]">
                    <Plus className="h-3.5 w-3.5" /> Sección
                  </button>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <h2 className="mb-4 text-xl font-bold text-[var(--color-text)]">Descripción</h2>
              <div className="group relative">
                <Pencil className="absolute right-2 top-2 h-3.5 w-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <textarea value={description} rows={6} onChange={(e) => setDescription(e.target.value)}
                  className="w-full resize-none rounded-xl border-2 border-transparent bg-transparent text-sm leading-relaxed text-[var(--color-text-secondary)] focus:border-[var(--color-primary)]/30 focus:bg-[var(--color-surface-alt)] focus:p-3 focus:outline-none transition-all" />
              </div>
            </div>
          </div>

          {/* ── Columna derecha: Sidebar ── */}
          <div className="xl:col-span-1">
            <div className="sticky top-0 space-y-4">
              {/* Thumbnail/Video */}
              <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
                <div className="group relative aspect-video bg-zinc-900">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                      <Play className="ml-1 h-6 w-6 text-white/60" />
                    </div>
                    <p className="text-xs text-white/40">Video de presentación</p>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 opacity-0 transition-all hover:bg-black/60 hover:opacity-100 cursor-pointer">
                    <Upload className="h-8 w-8 text-white" />
                    <span className="text-xs font-medium text-white">Subir thumbnail</span>
                  </div>
                </div>
                <div className="flex gap-2 border-t border-[var(--color-border)] bg-amber-50 px-4 py-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-700">Configura Bunny.net para agregar video de presentación.</p>
                </div>
              </div>

              {/* Card de precio */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                {/* Toggle gratis */}
                <label className="mb-4 flex cursor-pointer items-center justify-between">
                  <span className="text-sm font-medium text-[var(--color-text)]">Curso gratuito</span>
                  <div className="relative" onClick={() => setIsFree((p) => !p)}>
                    <div className={`h-6 w-11 rounded-full transition-colors ${isFree ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}>
                      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${isFree ? 'left-6' : 'left-1'}`} />
                    </div>
                  </div>
                </label>

                {!isFree ? (
                  <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">Precio</label>
                    <div className="flex gap-2">
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                        className="w-20 shrink-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2 py-2.5 text-sm focus:outline-none">
                        <option value="USD">USD</option>
                        <option value="MXN">MXN</option>
                        <option value="COP">COP</option>
                      </select>
                      <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                        className="flex-1 min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2.5 text-2xl font-bold text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none" />
                    </div>
                    <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                      Vista del estudiante: <strong className="text-[var(--color-text)]">${price} {currency}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-center">
                    <span className="text-xl font-bold text-emerald-700">Gratis</span>
                  </div>
                )}

                {/* Guardar */}
                <button onClick={mockSave}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]">
                  {saved
                    ? <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> ¡Guardado!</>
                    : <><Save className="h-4 w-4" /> Guardar cambios</>}
                </button>

                {/* Publicar */}
                <button onClick={() => setIsPublished((p) => !p)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white ${isPublished ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'}`}>
                  {isPublished ? <><Lock className="h-4 w-4" /> Despublicar curso</> : <><Globe className="h-4 w-4" /> Publicar curso</>}
                </button>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                  <Eye className="h-3.5 w-3.5" />
                  <span>Ver cómo lo ven los estudiantes ↗</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Instructor</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-bold text-[var(--color-primary)]">C</div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">Carlos Mendoza</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Desarrollador Full-Stack con 8 años de experiencia.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
