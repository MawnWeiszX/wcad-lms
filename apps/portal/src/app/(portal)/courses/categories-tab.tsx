'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus, Trash2, Loader2, Tag, AlertTriangle,
  CheckCircle2, X, Pencil, BookOpen,
} from 'lucide-react';
import { createCategory, updateCategory, deleteCategory } from './category-actions';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  course_count: number;
}

interface Props {
  categories: Category[];
  usedCount: number;
}

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

export function CategoriesTab({ categories: initialCategories, usedCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showForm, setShowForm] = useState(searchParams.get('new') === '1');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [editForm, setEditForm] = useState({ name: '', slug: '', description: '' });

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Crear ─────────────────────────────────────────────────
  async function handleCreate() {
    if (!form.name.trim()) return;
    setSaving(true);
    const fd = new FormData();
    fd.set('name', form.name);
    fd.set('slug', form.slug || slugify(form.name));
    fd.set('description', form.description);
    const result = await createCategory(fd);
    if ('error' in result && result.error) {
      showToast('error', result.error);
    } else {
      // Optimistic: add locally with temp id (server revalidates)
      const tempCat: Category = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        slug: form.slug || slugify(form.name.trim()),
        description: form.description.trim() || null,
        course_count: 0,
      };
      setCategories(p => [...p, tempCat]);
      setForm({ name: '', slug: '', description: '' });
      setShowForm(false);
      showToast('success', `Categoría "${tempCat.name}" creada.`);
      startTransition(() => router.refresh());
    }
    setSaving(false);
  }

  // ── Editar ────────────────────────────────────────────────
  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, slug: cat.slug, description: cat.description ?? '' });
  }

  async function handleEdit(id: string) {
    if (!editForm.name.trim()) return;
    setSaving(true);
    const fd = new FormData();
    fd.set('name', editForm.name);
    fd.set('slug', editForm.slug || slugify(editForm.name));
    fd.set('description', editForm.description);
    const result = await updateCategory(id, fd);
    if ('error' in result && result.error) {
      showToast('error', result.error);
    } else {
      setCategories(p => p.map(c => c.id === id
        ? { ...c, name: editForm.name.trim(), slug: editForm.slug || slugify(editForm.name), description: editForm.description || null }
        : c
      ));
      setEditingId(null);
      showToast('success', 'Categoría actualizada.');
      startTransition(() => router.refresh());
    }
    setSaving(false);
  }

  // ── Eliminar ──────────────────────────────────────────────
  async function handleDelete(cat: Category) {
    if (cat.course_count > 0) return;
    if (!confirm(`¿Eliminar "${cat.name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(cat.id);
    const result = await deleteCategory(cat.id);
    if ('error' in result && result.error) {
      showToast('error', result.error);
    } else {
      setCategories(p => p.filter(c => c.id !== cat.id));
      showToast('success', `"${cat.name}" eliminada.`);
      startTransition(() => router.refresh());
    }
    setDeletingId(null);
  }

  const used = categories.filter(c => c.course_count > 0);
  const unused = categories.filter(c => c.course_count === 0);

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl animate-fade-in-up ${
          toast.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            : <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />}
          <span className="text-sm font-medium">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Resumen + Botón */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {categories.length} categoría{categories.length !== 1 ? 's' : ''} · {usedCount} en uso
        </p>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="flex items-center gap-2 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-accent-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all"
        >
          <Plus className="h-4 w-4" />
          Nueva categoría
        </button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <div className="rounded-2xl border-2 border-[var(--color-primary)]/30 bg-[var(--color-accent-bg)] p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <Tag className="h-4 w-4 text-[var(--color-primary)]" />
            Nueva categoría
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                placeholder="Ej: Agua Potable"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">Slug (URL)</label>
              <input
                type="text"
                value={form.slug}
                onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                placeholder="agua-potable"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5 text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">Descripción (opcional)</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Breve descripción de la categoría"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || !form.name.trim()}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Crear
            </button>
            <button
              onClick={() => { setShowForm(false); setForm({ name: '', slug: '', description: '' }); }}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Categorías en uso */}
      {used.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
            En uso · {used.length}
          </h3>
          <div className="space-y-2">
            {used.map(cat => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                isEditing={editingId === cat.id}
                editForm={editForm}
                setEditForm={setEditForm}
                onEdit={() => startEdit(cat)}
                onSaveEdit={() => handleEdit(cat.id)}
                onCancelEdit={() => setEditingId(null)}
                onDelete={() => handleDelete(cat)}
                deleting={deletingId === cat.id}
                saving={saving}
                canDelete={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Categorías sin uso */}
      {unused.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            <Tag className="h-3.5 w-3.5 text-amber-500" />
            Sin cursos asignados · {unused.length}
          </h3>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-amber-bg)] px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--color-amber-text)]" />
              <p className="text-xs text-[var(--color-amber-text)]">Estas categorías pueden eliminarse de forma segura — no están asignadas a ningún curso.</p>
            </div>
            <div className="divide-y divide-[var(--color-border)] p-2 space-y-1">
              {unused.map(cat => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  isEditing={editingId === cat.id}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onEdit={() => startEdit(cat)}
                  onSaveEdit={() => handleEdit(cat.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => handleDelete(cat)}
                  deleting={deletingId === cat.id}
                  saving={saving}
                  canDelete
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {categories.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-20 text-center">
          <Tag className="mb-4 h-12 w-12 text-[var(--color-text-muted)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Sin categorías aún</h3>
          <p className="mt-2 mb-6 max-w-xs text-sm text-[var(--color-text-secondary)]">
            Crea las categorías que mejor describan los cursos de tu plataforma.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Crear primera categoría
          </button>
        </div>
      )}
    </div>
  );
}

// ── Fila individual de categoría ──────────────────────────────
function CategoryRow({
  cat, isEditing, editForm, setEditForm,
  onEdit, onSaveEdit, onCancelEdit, onDelete,
  deleting, saving, canDelete,
}: {
  cat: Category;
  isEditing: boolean;
  editForm: { name: string; slug: string; description: string };
  setEditForm: (v: { name: string; slug: string; description: string }) => void;
  onEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  saving: boolean;
  canDelete: boolean;
}) {
  if (isEditing) {
    return (
      <div className="rounded-2xl border-2 border-[var(--color-primary)]/30 bg-[var(--color-accent-bg)] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            autoFocus
            type="text"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value, slug: slugify(e.target.value) })}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
          />
          <input
            type="text"
            value={editForm.slug}
            onChange={e => setEditForm({ ...editForm, slug: e.target.value })}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm font-mono text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
          />
          <div className="sm:col-span-2">
            <input
              type="text"
              value={editForm.description}
              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Descripción (opcional)"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onSaveEdit}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Guardar
          </button>
          <button
            onClick={onCancelEdit}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 transition-all hover:border-[var(--color-primary)]/25 hover:shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-bg)] text-[var(--color-primary)]">
        <Tag className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-[var(--color-text)]">{cat.name}</p>
          {cat.course_count > 0 && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {cat.course_count} curso{cat.course_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="mt-0.5 font-mono text-[11px] text-[var(--color-text-muted)]">/{cat.slug}</p>
        {cat.description && (
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] truncate">{cat.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
        {canDelete && (
          <button
            onClick={onDelete}
            disabled={!!deleting}
            className="flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
