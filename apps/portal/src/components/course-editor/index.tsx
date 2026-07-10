'use client';

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/toast';
import { createClient } from '@wcad/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Loader2,
  Play, Globe, Lock, Users, Clock,
  CheckCircle2, Circle, Upload, Save, Eye,
  BookOpen, Info,
  Pencil, Target,
  AlignLeft, ListChecks,
  BarChart2, DollarSign, Settings2,
  ChevronRight,
} from 'lucide-react';
import type { Module, Props, CourseForm } from './types';
import { fmtDuration, slugify } from './types';
import { OverviewTab } from './tab-overview';
import { ContentTab } from './tab-content';
import { SettingsTab } from './tab-settings';

// ── Tab badge ────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label, count }: {
  active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>;
  label: string; count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]',
      ].join(' ')}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
      {count !== undefined && (
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
          active ? 'bg-white/20 text-white' : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Componente principal ─────────────────────────────────────
export function CoursePageEditor({
  course, modules: initModules, teacher, categories,
  bunnyConfigured, bunnyLibraryId,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'settings'>('overview');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [teacherAvatarError, setTeacherAvatarError] = useState(false);

  const [form, setForm] = useState<CourseForm>({
    title: course.title,
    slug: course.slug,
    short_description: course.short_description ?? '',
    description: course.description ?? '',
    price: String(course.price),
    currency: course.currency,
    level: course.level,
    category_id: course.category_id ?? '',
    is_free: course.is_free,
    is_published: course.is_published,
    what_you_learn: course.what_you_learn.length > 0 ? course.what_you_learn : [''],
    requirements: course.requirements.length > 0 ? course.requirements : [''],
  });

  // Currículum
  const [modules, setModules] = useState<Module[]>(initModules);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingModule, setAddingModule] = useState(false);
  const [newLessonTitles, setNewLessonTitles] = useState<Record<string, string>>({});
  const [curriculumSaving, setCurriculumSaving] = useState<string | null>(null);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [thumbUrl, setThumbUrl] = useState(course.thumbnail_url);

  // Drag-and-drop
  const dragModuleIdx = useRef<number | null>(null);
  const dragOverModuleIdx = useRef<number | null>(null);
  const [dragModuleActive, setDragModuleActive] = useState<number | null>(null);
  const [dragOverModule, setDragOverModule] = useState<number | null>(null);
  const dragLessonKey = useRef<{ moduleId: string; lessonIdx: number } | null>(null);
  const dragOverLessonKey = useRef<{ moduleId: string; lessonIdx: number } | null>(null);
  const [dragLessonActive, setDragLessonActive] = useState<{ moduleId: string; lessonIdx: number } | null>(null);
  const [dragOverLesson, setDragOverLesson] = useState<{ moduleId: string; lessonIdx: number } | null>(null);

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);

  // ── Guardar ──────────────────────────────────────────────
  async function saveCourse(overrides?: Partial<typeof form>) {
    setSaving(true);
    try {
      const data = { ...form, ...overrides };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('courses') as any).update({
        title: data.title.trim(),
        slug: data.slug.trim(),
        short_description: data.short_description.trim() || null,
        description: data.description.trim() || null,
        price: data.is_free ? 0 : parseFloat(data.price) || 0,
        currency: data.currency,
        level: data.level,
        category_id: data.category_id || null,
        is_free: data.is_free,
        what_you_learn: data.what_you_learn.map(x => x.trim()).filter(Boolean),
        requirements: data.requirements.map(x => x.trim()).filter(Boolean),
      }).eq('id', course.id);
      if (error) throw error;
      if (overrides) setForm(p => ({ ...p, ...overrides }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      showToast('Curso guardado');
      router.refresh();
    } catch {
      showToast('Error al guardar el curso', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    setPublishing(true);
    try {
      const newVal = !form.is_published;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('courses') as any).update({ is_published: newVal }).eq('id', course.id);
      if (error) throw error;
      setForm(p => ({ ...p, is_published: newVal }));
      showToast(newVal ? 'Curso publicado' : 'Curso despublicado');
      router.refresh();
    } catch {
      showToast('Error al cambiar estado de publicación', 'error');
    } finally {
      setPublishing(false);
    }
  }

  // ── Thumbnail ────────────────────────────────────────────
  async function uploadThumbnail(file: File) {
    setThumbUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `thumbnails/${course.id}.${ext}`;
      const { data, error } = await supabase.storage.from('course-assets').upload(path, file, { upsert: true });
      if (error || !data) throw error ?? new Error('Upload failed');
      const { data: { publicUrl } } = supabase.storage.from('course-assets').getPublicUrl(path);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateErr } = await (supabase.from('courses') as any).update({ thumbnail_url: publicUrl }).eq('id', course.id);
      if (updateErr) throw updateErr;
      setThumbUrl(publicUrl);
      showToast('Portada actualizada');
    } catch {
      showToast('Error al subir la portada', 'error');
    } finally {
      setThumbUploading(false);
    }
  }

  // ── Lo que aprenderás ────────────────────────────────────
  function updateLearnItem(idx: number, val: string) {
    const arr = [...form.what_you_learn]; arr[idx] = val;
    setForm(p => ({ ...p, what_you_learn: arr }));
  }
  function addLearnItem() { setForm(p => ({ ...p, what_you_learn: [...p.what_you_learn, ''] })); }
  function removeLearnItem(idx: number) {
    setForm(p => ({ ...p, what_you_learn: p.what_you_learn.filter((_, i) => i !== idx) }));
  }

  // ── Requisitos ───────────────────────────────────────────
  function updateReqItem(idx: number, val: string) {
    const arr = [...form.requirements]; arr[idx] = val;
    setForm(p => ({ ...p, requirements: arr }));
  }
  function addReqItem() { setForm(p => ({ ...p, requirements: [...p.requirements, ''] })); }
  function removeReqItem(idx: number) {
    setForm(p => ({ ...p, requirements: p.requirements.filter((_, i) => i !== idx) }));
  }

  // ── Módulos y lecciones ──────────────────────────────────
  async function addModule() {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    try {
      const { data, error } = await supabase.from('modules')
        .insert({ course_id: course.id, title: newModuleTitle.trim(), position: modules.length })
        .select('id, title, position').single();
      if (error) throw error;
      if (data) { setModules(p => [...p, { ...data, lessons: [] }]); setNewModuleTitle(''); }
      showToast('Módulo creado');
    } catch {
      showToast('Error al crear módulo', 'error');
    } finally {
      setAddingModule(false);
    }
  }

  async function deleteModule(id: string) {
    if (!confirm('¿Eliminar este módulo y todas sus lecciones?')) return;
    try {
      const { error } = await supabase.from('modules').delete().eq('id', id);
      if (error) throw error;
      setModules(p => p.filter(m => m.id !== id));
      showToast('Módulo eliminado');
    } catch {
      showToast('Error al eliminar módulo', 'error');
    }
  }

  async function addLesson(moduleId: string) {
    const title = newLessonTitles[moduleId]?.trim();
    if (!title) return;
    setCurriculumSaving(moduleId);
    try {
      const mod = modules.find(m => m.id === moduleId);
      const { data, error } = await supabase.from('lessons')
        .insert({ module_id: moduleId, title, position: mod?.lessons.length ?? 0, duration_seconds: 0, is_free: false })
        .select('id, title, duration_seconds, position, is_free, bunny_video_id').single();
      if (error) throw error;
      if (data) {
        setModules(p => p.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, data] } : m));
        setNewLessonTitles(p => ({ ...p, [moduleId]: '' }));
      }
    } catch {
      showToast('Error al crear lección', 'error');
    } finally {
      setCurriculumSaving(null);
    }
  }

  async function deleteLesson(moduleId: string, lessonId: string) {
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
      if (error) throw error;
      setModules(p => p.map(m =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m
      ));
    } catch {
      showToast('Error al eliminar lección', 'error');
    }
  }

  // ── Drag-and-drop módulos ────────────────────────────────
  const handleModuleDragStart = useCallback((idx: number) => {
    dragModuleIdx.current = idx;
    setDragModuleActive(idx);
  }, []);

  const handleModuleDragEnter = useCallback((idx: number) => {
    dragOverModuleIdx.current = idx;
    setDragOverModule(idx);
  }, []);

  const handleModuleDrop = useCallback(() => {
    const from = dragModuleIdx.current;
    const to = dragOverModuleIdx.current;
    if (from === null || to === null || from === to) {
      setDragModuleActive(null); setDragOverModule(null); return;
    }
    setModules(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      const reindexed = next.map((m, i) => ({ ...m, position: i }));
      interface RpcClient {
        rpc(fn: string, args?: unknown): Promise<unknown>;
      }
      (supabase as unknown as RpcClient).rpc('reorder_items', {
        p_table: 'modules',
        p_items: reindexed.map(m => ({ id: m.id, position: m.position })),
      }).catch(() => null);
      return reindexed;
    });
    dragModuleIdx.current = null;
    dragOverModuleIdx.current = null;
    setDragModuleActive(null);
    setDragOverModule(null);
  }, [supabase]);

  // ── Drag-and-drop lecciones ──────────────────────────────
  const handleLessonDragStart = useCallback((moduleId: string, lessonIdx: number) => {
    dragLessonKey.current = { moduleId, lessonIdx };
    setDragLessonActive({ moduleId, lessonIdx });
  }, []);

  const handleLessonDragEnter = useCallback((moduleId: string, lessonIdx: number) => {
    dragOverLessonKey.current = { moduleId, lessonIdx };
    setDragOverLesson({ moduleId, lessonIdx });
  }, []);

  const handleLessonDrop = useCallback(async (targetModuleId: string) => {
    const from = dragLessonKey.current;
    const to = dragOverLessonKey.current;
    if (!from || !to || (from.moduleId === to.moduleId && from.lessonIdx === to.lessonIdx)) {
      setDragLessonActive(null); setDragOverLesson(null); return;
    }
    if (from.moduleId !== targetModuleId || to.moduleId !== targetModuleId) {
      setDragLessonActive(null); setDragOverLesson(null); return;
    }
    setModules(prev => prev.map(m => {
      if (m.id !== targetModuleId) return m;
      const next = [...m.lessons];
      const [moved] = next.splice(from.lessonIdx, 1);
      next.splice(to.lessonIdx, 0, moved);
      const reindexed = next.map((l, i) => ({ ...l, position: i }));
      interface RpcClient {
        rpc(fn: string, args?: unknown): Promise<unknown>;
      }
      (supabase as unknown as RpcClient).rpc('reorder_items', {
        p_table: 'lessons',
        p_items: reindexed.map(l => ({ id: l.id, position: l.position })),
      }).catch(() => null);
      return { ...m, lessons: reindexed };
    }));
    dragLessonKey.current = null;
    dragOverLessonKey.current = null;
    setDragLessonActive(null);
    setDragOverLesson(null);
  }, [supabase]);

  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">

      {/* ── HERO EDITABLE ─────────────────────────────────── */}
      <div className="relative border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 lg:px-10">
        <div className="relative mx-auto max-w-5xl">
          {/* Selects de metadatos */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <select
              value={form.category_id}
              onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
              onBlur={() => saveCourse()}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/50 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <option value="">Sin categoría</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={form.level}
              onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
              onBlur={() => saveCourse()}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/50 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
            {form.is_published && (
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Publicado
              </span>
            )}
          </div>

          {/* Título editable */}
          <div className="group relative mb-3">
            <textarea
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value, slug: slugify(e.target.value) }))}
              onBlur={() => saveCourse()}
              rows={2}
              placeholder="Escribe el título del curso aquí..."
              className="w-full resize-none rounded-xl border-2 border-transparent bg-transparent text-2xl font-bold leading-tight text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]/40 focus:bg-[var(--color-surface-alt)] focus:px-3 focus:py-2 focus:outline-none transition-all lg:text-3xl"
            />
            <Pencil className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-[var(--color-text-muted)]/40 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          {/* Descripción corta editable */}
          <div className="group relative mb-6">
            <textarea
              value={form.short_description}
              onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))}
              onBlur={() => saveCourse()}
              rows={2}
              placeholder="Descripción corta visible en el catálogo..."
              className="w-full resize-none rounded-xl border-2 border-transparent bg-transparent text-base leading-relaxed text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]/30 focus:bg-[var(--color-surface-alt)] focus:px-3 focus:py-2 focus:outline-none transition-all"
            />
            <Pencil className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-[var(--color-text-muted)]/40 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          {/* Stats del curso */}
          <div className="flex flex-wrap items-center gap-5 text-sm text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
              {course.students_count.toLocaleString()} estudiantes
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
              {fmtDuration(course.total_duration_seconds)} de contenido
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-[var(--color-text-muted)]" />
              {totalLessons} lecciones · {modules.length} secciones
            </span>
          </div>
        </div>
      </div>

      {/* ── TABS DE NAVEGACIÓN ──────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-1 px-6 py-2 lg:px-10">
          <TabBtn
            active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}
            icon={AlignLeft} label="Resumen"
          />
          <TabBtn
            active={activeTab === 'content'} onClick={() => setActiveTab('content')}
            icon={ListChecks} label="Contenido"
            count={totalLessons}
          />
          <TabBtn
            active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}
            icon={Settings2} label="Ajustes"
          />

          {/* Spacer + estado guardado */}
          <div className="ml-auto flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 animate-fade-in-up">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Guardado
              </span>
            )}
            <button
              onClick={() => saveCourse()}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] shadow-sm hover:bg-[var(--color-surface-alt)] disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </button>
            <button
              onClick={togglePublish}
              disabled={publishing}
              className={[
                'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50',
                form.is_published
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-[var(--color-primary)]/20',
              ].join(' ')}
            >
              {publishing
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : form.is_published
                  ? <Lock className="h-4 w-4" />
                  : <Globe className="h-4 w-4" />}
              {form.is_published ? 'Despublicar' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ─────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* ── COLUMNA IZQUIERDA (contenido por tab) ── */}
          <div className="lg:col-span-2 space-y-6">

            {activeTab === 'overview' && (
              <OverviewTab
                form={form}
                teacher={teacher}
                teacherAvatarError={teacherAvatarError}
                setTeacherAvatarError={setTeacherAvatarError}
                updateLearnItem={updateLearnItem}
                addLearnItem={addLearnItem}
                removeLearnItem={removeLearnItem}
                updateReqItem={updateReqItem}
                addReqItem={addReqItem}
                removeReqItem={removeReqItem}
                setForm={setForm}
                saveCourse={saveCourse}
              />
            )}

            {activeTab === 'content' && (
              <ContentTab
                course={course}
                modules={modules}
                totalLessons={totalLessons}
                newModuleTitle={newModuleTitle}
                setNewModuleTitle={setNewModuleTitle}
                addingModule={addingModule}
                newLessonTitles={newLessonTitles}
                setNewLessonTitles={setNewLessonTitles}
                curriculumSaving={curriculumSaving}
                supabase={supabase}
                setModules={setModules}
                addModule={addModule}
                deleteModule={deleteModule}
                addLesson={addLesson}
                deleteLesson={deleteLesson}
                dragModuleActive={dragModuleActive}
                dragOverModule={dragOverModule}
                handleModuleDragStart={handleModuleDragStart}
                handleModuleDragEnter={handleModuleDragEnter}
                handleModuleDrop={handleModuleDrop}
                setDragModuleActive={setDragModuleActive}
                setDragOverModule={setDragOverModule}
                dragLessonActive={dragLessonActive}
                dragOverLesson={dragOverLesson}
                handleLessonDragStart={handleLessonDragStart}
                handleLessonDragEnter={handleLessonDragEnter}
                handleLessonDrop={handleLessonDrop}
                setDragLessonActive={setDragLessonActive}
                setDragOverLesson={setDragOverLesson}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                form={form}
                setForm={setForm}
                saving={saving}
                saveCourse={saveCourse}
              />
            )}
          </div>

          {/* ── COLUMNA DERECHA STICKY ─────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-[65px] space-y-4">

              {/* Miniatura / Video */}
              <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="relative aspect-video bg-slate-900">
                  {course.trailer_video_id && bunnyLibraryId ? (
                    <iframe
                      src={`https://iframe.mediadelivery.net/embed/${bunnyLibraryId}/${course.trailer_video_id}`}
                      className="h-full w-full"
                      allowFullScreen
                      allow="autoplay"
                    />
                  ) : thumbUrl ? (
                    <Image src={thumbUrl} alt="" fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                        <Play className="ml-1 h-6 w-6 text-white/50" />
                      </div>
                      <p className="text-xs text-white/30">Sin portada</p>
                    </div>
                  )}
                  {/* Overlay upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={thumbUploading}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-200 hover:bg-black/60 hover:opacity-100"
                  >
                    {thumbUploading
                      ? <Loader2 className="h-8 w-8 animate-spin text-white" />
                      : <>
                          <Upload className="h-7 w-7 text-white" />
                          <span className="text-xs font-semibold text-white">Cambiar portada</span>
                        </>}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadThumbnail(f); }}
                  />
                </div>

                {!bunnyConfigured && (
                  <div className="flex gap-2 border-t border-amber-100 bg-amber-50 px-4 py-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <p className="text-xs text-amber-700">
                      Configura Bunny.net para agregar un video de presentación.
                    </p>
                  </div>
                )}
              </div>

              {/* Resumen de acciones */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Estado del curso
                </h3>

                {/* Precio */}
                <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-alt)] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <DollarSign className="h-3.5 w-3.5" />
                    Precio
                  </div>
                  <span className="font-bold text-[var(--color-text)]">
                    {form.is_free ? (
                      <span className="text-emerald-600">Gratis</span>
                    ) : (
                      `S/ ${Number(form.price || 0).toFixed(2)}`
                    )}
                  </span>
                </div>

                {/* Nivel */}
                <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-alt)] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <BarChart2 className="h-3.5 w-3.5" />
                    Nivel
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    {{ beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }[form.level] ?? form.level}
                  </span>
                </div>

                {/* Estudiantes */}
                <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-alt)] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Users className="h-3.5 w-3.5" />
                    Estudiantes
                  </div>
                  <span className="text-sm font-bold text-[var(--color-text)]">{course.students_count.toLocaleString()}</span>
                </div>

                {/* Contenido */}
                <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-alt)] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Target className="h-3.5 w-3.5" />
                    Contenido
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    {totalLessons} lec. · {modules.length} sec.
                  </span>
                </div>

                {/* Publicar / Despublicar */}
                <button
                  onClick={togglePublish}
                  disabled={publishing}
                  className={[
                    'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50',
                    form.is_published
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                      : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-[var(--color-primary)]/25',
                  ].join(' ')}
                >
                  {publishing
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : form.is_published
                      ? <Lock className="h-4 w-4" />
                      : <Globe className="h-4 w-4" />}
                  {form.is_published ? 'Despublicar curso' : 'Publicar curso'}
                </button>

                {/* Ver en público */}
                <a
                  href={`${process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000'}/courses/${course.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] py-2.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver como estudiante ↗
                </a>
              </div>

              {/* Checklist de completitud */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Completitud del curso
                </h3>
                <div className="space-y-2.5">
                  {[
                    { label: 'Título del curso', done: form.title.trim().length > 10 },
                    { label: 'Descripción corta', done: form.short_description.trim().length > 20 },
                    { label: 'Descripción completa', done: form.description.trim().length > 50 },
                    { label: 'Lo que aprenderás (mín. 1)', done: form.what_you_learn.some(x => x.trim().length > 0) },
                    { label: 'Requisitos previos (mín. 1)', done: form.requirements.some(x => x.trim().length > 0) },
                    { label: 'Imagen de portada', done: !!thumbUrl },
                    { label: 'Al menos 1 módulo', done: modules.length > 0 },
                    { label: 'Al menos 1 lección', done: totalLessons > 0 },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                        done ? 'bg-emerald-100' : 'bg-[var(--color-surface-alt)]'
                      }`}>
                        {done
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          : <Circle className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />}
                      </div>
                      <span className={`text-xs transition-colors ${done ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                        {label}
                      </span>
                      {done && <ChevronRight className="ml-auto h-3 w-3 text-emerald-500" />}
                    </div>
                  ))}
                </div>
                {/* Barra de progreso */}
                {(() => {
                  const items = [
                    form.title.trim().length > 10,
                    form.short_description.trim().length > 20,
                    form.description.trim().length > 50,
                    form.what_you_learn.some(x => x.trim().length > 0),
                    form.requirements.some(x => x.trim().length > 0),
                    !!thumbUrl,
                    modules.length > 0,
                    totalLessons > 0,
                  ];
                  const pct = Math.round((items.filter(Boolean).length / items.length) * 100);
                  return (
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-[var(--color-text-muted)]">Progreso</span>
                        <span className="font-semibold text-[var(--color-primary)]">{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-indigo-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
