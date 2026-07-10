'use client';

import React from 'react';
import { Loader2, Save } from 'lucide-react';
import type { CourseForm } from './types';

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
export interface SettingsTabProps {
  form: CourseForm;
  setForm: React.Dispatch<React.SetStateAction<CourseForm>>;
  saving: boolean;
  saveCourse: (overrides?: Partial<CourseForm>) => Promise<void>;
}

// ── Component ───────────────────────────────────────────────
export function SettingsTab({ form, setForm, saving, saveCourse }: SettingsTabProps) {
  return (
    <SectionCard title="Ajustes del curso" subtitle="Configuración de precio, URL y visibilidad">
      <div className="space-y-6">
        {/* URL del curso */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            URL del curso
          </label>
          <div className="flex items-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
            <span className="shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-xs text-[var(--color-text-muted)]">
              …/courses/
            </span>
            <input
              value={form.slug}
              onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
              onBlur={() => saveCourse()}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[var(--color-text)] focus:outline-none"
            />
          </div>
        </div>

        {/* Precio */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            Precio
          </label>
          <div className="flex items-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
            <span className="shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-base font-bold text-[var(--color-text-secondary)]">
              S/
            </span>
            <input
              type="number" min="0" step="0.01"
              value={form.price}
              disabled={form.is_free}
              onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
              className="flex-1 bg-transparent px-4 py-2.5 text-2xl font-bold text-[var(--color-text)] focus:outline-none disabled:opacity-50 transition-colors"
              placeholder="0.00"
            />
          </div>
          {/* Toggle gratuito */}
          <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl bg-[var(--color-surface-alt)] px-4 py-3">
            <span className="text-sm font-medium text-[var(--color-text)]">Curso gratuito</span>
            <div
              className="relative"
              onClick={() => setForm(p => ({ ...p, is_free: !p.is_free }))}
            >
              <div className={`h-6 w-11 rounded-full transition-colors duration-200 ${form.is_free ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}>
                <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${form.is_free ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
          </label>
        </div>

        {/* Guardar ajustes */}
        <button
          onClick={() => saveCourse()}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors shadow-lg shadow-[var(--color-primary)]/20"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar ajustes
        </button>
      </div>
    </SectionCard>
  );
}
