'use client';

import React from 'react';
import {
  Plus, Trash2, GripVertical, Loader2,
  Play, Clock, Circle, BookOpen,
  ChevronDown, Sparkles,
} from 'lucide-react';
import type { Module, Course } from './types';
import { fmtDuration } from './types';

// ── Shared sub-component ────────────────────────────────────
function SectionCard({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]/60 px-6 py-4">
        <h2 className="font-semibold text-[var(--color-text)]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Props ───────────────────────────────────────────────────
export interface ContentTabProps {
  course: Course;
  modules: Module[];
  totalLessons: number;
  newModuleTitle: string;
  setNewModuleTitle: (v: string) => void;
  addingModule: boolean;
  newLessonTitles: Record<string, string>;
  setNewLessonTitles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  curriculumSaving: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
  addModule: () => void;
  deleteModule: (id: string) => void;
  addLesson: (moduleId: string) => void;
  deleteLesson: (moduleId: string, lessonId: string) => void;
  // Drag module
  dragModuleActive: number | null;
  dragOverModule: number | null;
  handleModuleDragStart: (idx: number) => void;
  handleModuleDragEnter: (idx: number) => void;
  handleModuleDrop: () => void;
  setDragModuleActive: (v: number | null) => void;
  setDragOverModule: (v: number | null) => void;
  // Drag lesson
  dragLessonActive: { moduleId: string; lessonIdx: number } | null;
  dragOverLesson: { moduleId: string; lessonIdx: number } | null;
  handleLessonDragStart: (moduleId: string, lessonIdx: number) => void;
  handleLessonDragEnter: (moduleId: string, lessonIdx: number) => void;
  handleLessonDrop: (targetModuleId: string) => void;
  setDragLessonActive: (v: { moduleId: string; lessonIdx: number } | null) => void;
  setDragOverLesson: (v: { moduleId: string; lessonIdx: number } | null) => void;
}

// ── Component ───────────────────────────────────────────────
export function ContentTab({
  course, modules, totalLessons,
  newModuleTitle, setNewModuleTitle, addingModule,
  newLessonTitles, setNewLessonTitles, curriculumSaving,
  supabase, setModules,
  addModule, deleteModule, addLesson, deleteLesson,
  dragModuleActive, dragOverModule,
  handleModuleDragStart, handleModuleDragEnter, handleModuleDrop,
  setDragModuleActive, setDragOverModule,
  dragLessonActive, dragOverLesson,
  handleLessonDragStart, handleLessonDragEnter, handleLessonDrop,
  setDragLessonActive, setDragOverLesson,
}: ContentTabProps) {
  return (
    <SectionCard
      title="Contenido del curso"
      subtitle="Arrastra ⠿ para reordenar módulos y lecciones"
    >
      {/* Info banner si no hay módulos */}
      {modules.length === 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
          <div>
            <p className="text-sm font-medium text-indigo-900">Empieza a construir tu currículum</p>
            <p className="mt-1 text-xs text-indigo-600">Crea la primera sección y agrega las lecciones que componen tu curso.</p>
          </div>
        </div>
      )}

      {/* Stats rápidas */}
      {modules.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Secciones', value: modules.length, icon: BookOpen },
            { label: 'Lecciones', value: totalLessons, icon: Play },
            { label: 'Duración', value: fmtDuration(course.total_duration_seconds), icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2.5 rounded-xl bg-[var(--color-surface-alt)] px-3 py-2.5">
              <Icon className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                <p className="text-sm font-bold text-[var(--color-text)]">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista de módulos con DnD */}
      <div
        className="space-y-3"
        onDragOver={e => e.preventDefault()}
        onDrop={handleModuleDrop}
      >
        {modules.map((module, modIdx) => (
          <div
            key={module.id}
            draggable
            onDragStart={() => handleModuleDragStart(modIdx)}
            onDragEnter={() => handleModuleDragEnter(modIdx)}
            onDragOver={e => e.preventDefault()}
            onDragEnd={() => { setDragModuleActive(null); setDragOverModule(null); }}
            className={[
              'overflow-hidden rounded-2xl border transition-all duration-200',
              dragModuleActive === modIdx
                ? 'border-[var(--color-primary)] opacity-40 scale-[0.99] shadow-lg'
                : dragOverModule === modIdx && dragModuleActive !== null && dragModuleActive !== modIdx
                  ? 'border-[var(--color-primary)] border-2 shadow-md'
                  : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30',
            ].join(' ')}
          >
            <details open className="group/mod">
              <summary className="flex cursor-pointer list-none items-center gap-3 bg-[var(--color-surface-alt)] px-4 py-3.5 transition-colors hover:bg-[var(--color-surface-hover)]">
                <span
                  draggable
                  onDragStart={e => { e.stopPropagation(); handleModuleDragStart(modIdx); }}
                  className="cursor-grab active:cursor-grabbing touch-none shrink-0 rounded-lg p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-accent-bg)] transition-colors"
                  title="Arrastra para reordenar"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform [[open]_&]:rotate-180" />
                <input
                  defaultValue={module.title}
                  onBlur={async e => {
                    if (e.target.value !== module.title) {
                      await supabase.from('modules').update({ title: e.target.value }).eq('id', module.id);
                      setModules(p => p.map(m => m.id === module.id ? { ...m, title: e.target.value } : m));
                    }
                  }}
                  onClick={e => e.preventDefault()}
                  placeholder="Título de la sección..."
                  className="flex-1 bg-transparent text-sm font-semibold text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                />
                <span className="shrink-0 rounded-full bg-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                  {module.lessons.length}
                </span>
                <button
                  onClick={e => { e.preventDefault(); deleteModule(module.id); }}
                  className="shrink-0 rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </summary>

              <div
                className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.stopPropagation(); handleLessonDrop(module.id); }}
              >
                {module.lessons.map((lesson, lessonIdx) => (
                  <div
                    key={lesson.id}
                    draggable
                    onDragStart={e => { e.stopPropagation(); handleLessonDragStart(module.id, lessonIdx); }}
                    onDragEnter={e => { e.stopPropagation(); handleLessonDragEnter(module.id, lessonIdx); }}
                    onDragOver={e => e.preventDefault()}
                    onDragEnd={() => { setDragLessonActive(null); setDragOverLesson(null); }}
                    className={[
                      'flex items-center gap-3 px-5 py-3 transition-all duration-150',
                      dragLessonActive?.moduleId === module.id && dragLessonActive?.lessonIdx === lessonIdx
                        ? 'opacity-40 bg-[var(--color-accent-bg)]'
                        : dragOverLesson?.moduleId === module.id && dragOverLesson?.lessonIdx === lessonIdx
                            && dragLessonActive?.lessonIdx !== lessonIdx
                          ? 'border-t-2 border-[var(--color-primary)] bg-[var(--color-accent-bg)]/50'
                          : 'hover:bg-[var(--color-surface-alt)]',
                    ].join(' ')}
                  >
                    <span
                      draggable
                      onDragStart={e => { e.stopPropagation(); handleLessonDragStart(module.id, lessonIdx); }}
                      className="cursor-grab active:cursor-grabbing touch-none shrink-0 rounded-lg p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-accent-bg)] transition-colors"
                      title="Arrastra para reordenar"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-alt)]">
                      {lesson.bunny_video_id
                        ? <Play className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                        : <Circle className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />}
                    </div>
                    <a
                      href={`/courses/${course.id}/lessons/${lesson.id}`}
                      className="flex-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:underline transition-colors"
                    >
                      {lesson.title}
                    </a>
                    <div className="flex items-center gap-2">
                      {lesson.is_free && (
                        <span className="rounded-full bg-[var(--color-accent-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                          Gratis
                        </span>
                      )}
                      {lesson.duration_seconds > 0 && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {fmtDuration(lesson.duration_seconds)}
                        </span>
                      )}
                      <button
                        onClick={() => deleteLesson(module.id, lesson.id)}
                        className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Agregar lección */}
                <div className="flex items-center gap-2 bg-[var(--color-surface-alt)]/50 px-5 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-border)]">
                    <Plus className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Agregar lección..."
                    value={newLessonTitles[module.id] ?? ''}
                    onChange={e => setNewLessonTitles(p => ({ ...p, [module.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') addLesson(module.id); }}
                    className="flex-1 bg-transparent text-sm text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                  />
                  <button
                    onClick={() => addLesson(module.id)}
                    disabled={curriculumSaving === module.id || !newLessonTitles[module.id]?.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 disabled:opacity-40 transition-colors"
                  >
                    {curriculumSaving === module.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Plus className="h-3.5 w-3.5" />}
                    Agregar
                  </button>
                </div>
              </div>
            </details>
          </div>
        ))}

        {/* Agregar sección */}
        <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--color-border)] px-4 py-3.5 transition-all hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-accent-bg)]/30">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-border)]">
            <Plus className="h-4 w-4 text-[var(--color-text-muted)]" />
          </div>
          <input
            type="text"
            placeholder="Nombre de la nueva sección..."
            value={newModuleTitle}
            onChange={e => setNewModuleTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addModule(); }}
            className="flex-1 bg-transparent text-sm font-medium text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />
          <button
            onClick={addModule}
            disabled={addingModule || !newModuleTitle.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
          >
            {addingModule ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Crear sección
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
