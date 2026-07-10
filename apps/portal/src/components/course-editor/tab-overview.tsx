'use client';

import React from 'react';
import {
  Plus, Trash2,
  CheckCircle2,
} from 'lucide-react';
import type { CourseForm, Teacher } from './types';
import Image from 'next/image';

// ── Shared sub-components ───────────────────────────────────
// Re-used by this tab. Defined here because they're also used
// in other tabs; we accept them as "render-prop-style" imports
// from the parent via SectionCard / EditableArea props.
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

function EditableArea({ value, onChange, onBlur, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; onBlur: () => void;
  placeholder: string; rows?: number; large?: boolean;
}) {
  return (
    <div className="group relative">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        rows={rows}
        placeholder={placeholder}
        className={[
          'w-full resize-none rounded-xl border-2 border-transparent bg-[var(--color-surface-alt)] px-4 py-3 leading-relaxed',
          'text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]',
          'focus:border-[var(--color-primary)]/40 focus:bg-[var(--color-surface)] focus:outline-none',
          'transition-all duration-200',
          'text-sm',
        ].join(' ')}
      />
      <PencilIcon className="pointer-events-none absolute right-3 top-3 h-3.5 w-3.5 text-[var(--color-text-muted)] opacity-0 transition-opacity group-hover:opacity-60" />
    </div>
  );
}

// We import Pencil separately to keep the import block clean
import { Pencil as PencilIcon } from 'lucide-react';

// ── Props ───────────────────────────────────────────────────
export interface OverviewTabProps {
  form: CourseForm;
  teacher: Teacher | null;
  teacherAvatarError: boolean;
  setTeacherAvatarError: (v: boolean) => void;
  updateLearnItem: (idx: number, val: string) => void;
  addLearnItem: () => void;
  removeLearnItem: (idx: number) => void;
  updateReqItem: (idx: number, val: string) => void;
  addReqItem: () => void;
  removeReqItem: (idx: number) => void;
  setForm: React.Dispatch<React.SetStateAction<CourseForm>>;
  saveCourse: (overrides?: Partial<CourseForm>) => Promise<void>;
}

// ── Component ───────────────────────────────────────────────
export function OverviewTab({
  form, teacher, teacherAvatarError, setTeacherAvatarError,
  updateLearnItem, addLearnItem, removeLearnItem,
  updateReqItem, addReqItem, removeReqItem,
  setForm, saveCourse,
}: OverviewTabProps) {
  return (
    <>
      {/* Lo que aprenderás */}
      <SectionCard
        title="Lo que aprenderás"
        subtitle="Los objetivos de aprendizaje que verán los estudiantes antes de comprar"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {form.what_you_learn.map((item, idx) => (
            <div key={idx} className="group flex items-start gap-2">
              <div className="mt-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              </div>
              <input
                type="text"
                value={item}
                onChange={e => updateLearnItem(idx, e.target.value)}
                onBlur={() => saveCourse()}
                placeholder="Agrega un objetivo de aprendizaje..."
                className="flex-1 rounded-xl border-2 border-transparent bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]/30 focus:bg-[var(--color-surface)] focus:outline-none transition-all"
              />
              <button
                onClick={() => removeLearnItem(idx)}
                className="mt-2 opacity-0 group-hover:opacity-100 shrink-0 rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addLearnItem}
          className="mt-4 flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-accent-bg)] hover:text-[var(--color-primary)] transition-all"
        >
          <Plus className="h-4 w-4" /> Agregar objetivo
        </button>
      </SectionCard>

      {/* Descripción larga */}
      <SectionCard
        title="Descripción del curso"
        subtitle="Descripción completa que verán los estudiantes en la página del curso"
      >
        <EditableArea
          value={form.description}
          onChange={v => setForm(p => ({ ...p, description: v }))}
          onBlur={() => saveCourse()}
          placeholder="Describe en detalle qué aprenderán los estudiantes, qué proyectos construirán y por qué vale la pena tomar este curso..."
          rows={8}
        />
      </SectionCard>

      {/* Requisitos */}
      <SectionCard
        title="Requisitos previos"
        subtitle="Conocimientos o herramientas necesarias para tomar el curso"
      >
        <div className="space-y-2">
          {form.requirements.map((item, idx) => (
            <div key={idx} className="group flex items-center gap-2.5">
              <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]/50" />
              <input
                type="text"
                value={item}
                onChange={e => updateReqItem(idx, e.target.value)}
                onBlur={() => saveCourse()}
                placeholder="Ej: Conocimientos básicos de hidráulica"
                className="flex-1 rounded-xl border-2 border-transparent bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]/30 focus:bg-[var(--color-surface)] focus:outline-none transition-all"
              />
              <button
                onClick={() => removeReqItem(idx)}
                className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addReqItem}
          className="mt-4 flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-accent-bg)] hover:text-[var(--color-primary)] transition-all"
        >
          <Plus className="h-4 w-4" /> Agregar requisito
        </button>
      </SectionCard>

      {/* Instructor */}
      {teacher && (
        <SectionCard title="Instructor">
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[var(--color-primary)]/10 text-2xl font-bold text-[var(--color-primary)] flex items-center justify-center shadow-sm">
              {teacher.avatar_url && !teacherAvatarError
                ? <Image src={teacher.avatar_url} alt="" fill className="object-cover" onError={() => setTeacherAvatarError(true)} />
                : (teacher.full_name ?? 'P').charAt(0)}
            </div>
            <div>
              <p className="font-bold text-[var(--color-primary)]">{teacher.full_name}</p>
              {teacher.bio && (
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">{teacher.bio}</p>
              )}
            </div>
          </div>
        </SectionCard>
      )}
    </>
  );
}
