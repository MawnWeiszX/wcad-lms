'use client';

import { useState } from 'react';
import { createClient } from '@wcad/utils/supabase/client';
import { Plus, Trash2, ChevronDown, GripVertical, Loader2, Save } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  duration_seconds: number;
  position: number;
  is_free: boolean;
  bunny_video_id: string | null;
}
interface Module {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}
interface Props {
  courseId: string;
  initialModules: Module[];
}

export function CurriculumEditor({ courseId, initialModules }: Props) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [saving, setSaving] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingModule, setAddingModule] = useState(false);
  const [newLessonTitles, setNewLessonTitles] = useState<Record<string, string>>({});
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  // ── Módulos ────────────────────────────────────────────────
  async function addModule() {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    const { data, error } = await supabase
      .from('modules')
      .insert({ course_id: courseId, title: newModuleTitle.trim(), position: modules.length })
      .select('id, title, position')
      .single();
    if (!error && data) {
      setModules((prev) => [...prev, { ...data, lessons: [] }]);
      setNewModuleTitle('');
    }
    setAddingModule(false);
  }

  async function deleteModule(moduleId: string) {
    if (!confirm('¿Eliminar este módulo y todas sus lecciones?')) return;
    await supabase.from('modules').delete().eq('id', moduleId);
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
  }

  async function updateModuleTitle(moduleId: string, title: string) {
    setSaving(moduleId);
    await supabase.from('modules').update({ title }).eq('id', moduleId);
    setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, title } : m));
    setSaving(null);
  }

  // ── Lecciones ──────────────────────────────────────────────
  async function addLesson(moduleId: string) {
    const title = newLessonTitles[moduleId]?.trim();
    if (!title) return;
    setSaving(moduleId + '-lesson');
    const mod = modules.find((m) => m.id === moduleId);
    const position = mod?.lessons.length ?? 0;
    const { data, error } = await supabase
      .from('lessons')
      .insert({ module_id: moduleId, title, position, duration_seconds: 0, is_free: false })
      .select('id, title, duration_seconds, position, is_free, bunny_video_id')
      .single();
    if (!error && data) {
      setModules((prev) => prev.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, data] } : m
      ));
      setNewLessonTitles((prev) => ({ ...prev, [moduleId]: '' }));
    }
    setSaving(null);
  }

  async function deleteLesson(moduleId: string, lessonId: string) {
    await supabase.from('lessons').delete().eq('id', lessonId);
    setModules((prev) => prev.map((m) =>
      m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
    ));
  }

  async function toggleLessonFree(moduleId: string, lessonId: string, isFree: boolean) {
    await supabase.from('lessons').update({ is_free: !isFree }).eq('id', lessonId);
    setModules((prev) => prev.map((m) =>
      m.id === moduleId
        ? { ...m, lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, is_free: !isFree } : l) }
        : m
    ));
  }

  return (
    <div className="space-y-3">
      {/* Lista de módulos */}
      {modules.map((module) => (
        <details key={module.id} open className="group overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
          {/* Módulo header */}
          <summary className="flex cursor-pointer list-none items-center gap-3 bg-[var(--color-surface-alt)] px-4 py-3">
            <GripVertical className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform [[open]_&]:rotate-180" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--color-text)] focus:outline-none"
              defaultValue={module.title}
              onBlur={(e) => {
                if (e.target.value !== module.title) updateModuleTitle(module.id, e.target.value);
              }}
              onClick={(e) => e.preventDefault()}
            />
            {saving === module.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-text-muted)]" />}
            <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
              {module.lessons.length} lecciones
            </span>
            <button
              onClick={(e) => { e.preventDefault(); deleteModule(module.id); }}
              className="shrink-0 rounded p-1 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </summary>

          {/* Lecciones */}
          <div className="divide-y divide-[var(--color-border)]">
            {module.lessons.map((lesson) => (
              <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <GripVertical className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                <a
                  href={`/courses/${courseId}/lessons/${lesson.id}`}
                  className="flex-1 truncate text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:underline"
                >
                  {lesson.title}
                </a>
                {/* Toggle libre */}
                <button
                  onClick={() => toggleLessonFree(module.id, lesson.id, lesson.is_free)}
                  className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    lesson.is_free
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                  }`}
                >
                  {lesson.is_free ? 'Gratis' : 'Bloqueada'}
                </button>
                <button
                  onClick={() => deleteLesson(module.id, lesson.id)}
                  className="shrink-0 rounded p-1 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}

            {/* Agregar lección */}
            <div className="flex items-center gap-2 px-4 py-2.5">
              <input
                type="text"
                placeholder="+ Agregar lección..."
                value={newLessonTitles[module.id] ?? ''}
                onChange={(e) => setNewLessonTitles((prev) => ({ ...prev, [module.id]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') addLesson(module.id); }}
                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1.5 text-xs placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
              />
              <button
                onClick={() => addLesson(module.id)}
                disabled={saving === module.id + '-lesson'}
                className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)]/10 px-2.5 py-1.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 disabled:opacity-50"
              >
                {saving === module.id + '-lesson'
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Save className="h-3.5 w-3.5" />}
                Agregar
              </button>
            </div>
          </div>
        </details>
      ))}

      {/* Agregar módulo */}
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] bg-white px-4 py-3">
        <input
          type="text"
          placeholder="Nombre del nuevo módulo..."
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addModule(); }}
          className="flex-1 bg-transparent text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none"
        />
        <button
          onClick={addModule}
          disabled={addingModule || !newModuleTitle.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {addingModule ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Módulo
        </button>
      </div>
    </div>
  );
}
