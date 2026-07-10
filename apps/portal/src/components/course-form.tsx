'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@wcad/utils/supabase/client';
import { Loader2, Save, Globe, Lock, AlertCircle } from 'lucide-react';

interface Category { id: string; name: string; }
interface Props {
  teacherId: string;
  categories: Category[];
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    title: string;
    slug: string;
    short_description: string | null;
    description: string | null;
    price: number;
    currency: string;
    level: string;
    category_id: string | null;
    is_published: boolean;
    is_free: boolean;
  };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function CourseForm({ teacherId, categories, mode, initialData }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    slug: initialData?.slug ?? '',
    short_description: initialData?.short_description ?? '',
    description: initialData?.description ?? '',
    price: String(initialData?.price ?? '0'),
    currency: initialData?.currency ?? 'PEN',
    level: initialData?.level ?? 'beginner',
    category_id: initialData?.category_id ?? '',
    is_free: initialData?.is_free ?? false,
    is_published: initialData?.is_published ?? false,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Auto-generar slug al escribir el título (solo en creación)
      ...(name === 'title' && mode === 'create' ? { slug: slugify(value) } : {}),
    }));
    setError(null);
  }

  async function save(publish?: boolean) {
    if (!form.title.trim()) { setError('El título es obligatorio.'); return; }
    if (!form.slug.trim()) { setError('El slug es obligatorio.'); return; }

    const isSaving = publish === undefined;
    if (isSaving) setSaving(true); else setPublishing(true);

    const supabase = createClient();
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      short_description: form.short_description.trim() || null,
      description: form.description.trim() || null,
      price: form.is_free ? 0 : parseFloat(form.price) || 0,
      currency: form.currency,
      level: form.level,
      category_id: form.category_id || null,
      is_free: form.is_free,
      is_published: publish !== undefined ? publish : form.is_published,
      teacher_id: teacherId,
    };

    if (mode === 'create') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: err } = await (supabase.from('courses') as any)
        .insert(payload)
        .select('id')
        .single();
      if (err) { setError(err.message); setSaving(false); setPublishing(false); return; }
      router.push(`/courses/${data.id}`);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase.from('courses') as any)
        .update(payload)
        .eq('id', initialData!.id);
      if (err) { setError(err.message); setSaving(false); setPublishing(false); return; }
      setForm((prev) => ({ ...prev, is_published: payload.is_published }));
      router.refresh();
    }

    setSaving(false);
    setPublishing(false);
  }

  const inputClass = 'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20';
  const labelClass = 'mb-1.5 block text-sm font-medium text-[var(--color-text)]';

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
        <h2 className="font-semibold text-[var(--color-text)]">Información básica</h2>
        <div>
          <label htmlFor="title" className={labelClass}>Título del curso *</label>
          <input id="title" name="title" type="text" value={form.title}
            onChange={handleChange} placeholder="Ej: Desarrollo Web con Next.js 15" className={inputClass} />
        </div>

        <div>
          <label htmlFor="slug" className={labelClass}>
            Slug (URL) — wcadservice.com/courses/<strong>{form.slug || 'tu-slug'}</strong>
          </label>
          <input id="slug" name="slug" type="text" value={form.slug}
            onChange={handleChange} placeholder="desarrollo-web-nextjs" className={inputClass} />
        </div>

        <div>
          <label htmlFor="short_description" className={labelClass}>Descripción corta</label>
          <textarea id="short_description" name="short_description" rows={2}
            value={form.short_description} onChange={handleChange}
            placeholder="Resumen del curso (aparece en las tarjetas del catálogo)"
            className={`${inputClass} resize-none`} />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>Descripción completa</label>
          <textarea id="description" name="description" rows={6}
            value={form.description} onChange={handleChange}
            placeholder="Describe en detalle qué aprenderán los estudiantes..."
            className={`${inputClass} resize-none`} />
        </div>
      </div>

      {/* Configuración */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
        <h2 className="font-semibold text-[var(--color-text)]">Configuración</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="category_id" className={labelClass}>Categoría</label>
            <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange} className={inputClass}>
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="level" className={labelClass}>Nivel</label>
            <select id="level" name="level" value={form.level} onChange={handleChange} className={inputClass}>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>

          <div>
            <label htmlFor="price" className={labelClass}>Precio (en Soles S/)</label>
            <input id="price" name="price" type="number" min="0" step="0.01"
              value={form.price} onChange={handleChange}
              disabled={form.is_free}
              placeholder="49.99" className={`${inputClass} ${form.is_free ? 'opacity-50' : ''}`} />
          </div>
        </div>

        {/* Toggle gratis */}
        <label className="flex cursor-pointer items-center gap-3 mt-2">
          <div className="relative">
            <input type="checkbox" name="is_free" checked={form.is_free}
              onChange={handleChange} className="sr-only" />
            <div className={`h-6 w-11 rounded-full transition-colors duration-200 ${form.is_free ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}>
              <div className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${form.is_free ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>
          <span className="text-sm font-medium text-[var(--color-text)]">Curso gratuito</span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/25 flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Botones */}
      <div className="flex items-center justify-between">
        <button onClick={() => save()} disabled={saving || publishing}
          className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-all hover:bg-[var(--color-surface-hover)] disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar borrador
        </button>

        <button onClick={() => save(!form.is_published)} disabled={saving || publishing}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 active:scale-[0.98] ${
            form.is_published
              ? 'bg-amber-500 hover:bg-amber-600'
              : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'
          }`}>
          {publishing
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : form.is_published
            ? <Lock className="h-4 w-4" />
            : <Globe className="h-4 w-4" />}
          {form.is_published ? 'Despublicar' : 'Publicar curso'}
        </button>
      </div>
    </div>
  );
}
