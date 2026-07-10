'use client';

import { useUser } from '@/components/user-context';
import { User, ShieldAlert } from 'lucide-react';

export function ModeToggle() {
  const { role, modoActivo, setModoActivo } = useUser();

  if (role !== 'profesor') return null;

  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
      <span className="text-[10px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase px-2">
        Modo de Vista
      </span>
      <div className="relative flex rounded-lg bg-[var(--color-surface)] p-0.5 border border-[var(--color-border)] shadow-sm">
        {/* Background Highlight slider */}
        <div
          className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-[var(--color-primary)] transition-all duration-300 ${
            modoActivo === 'profesor' ? 'translate-x-full' : 'translate-x-0'
          }`}
        />

        {/* Alumno Button */}
        <button
          type="button"
          onClick={() => setModoActivo('alumno')}
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors select-none cursor-pointer ${
            modoActivo === 'alumno' ? 'text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>Alumno</span>
        </button>

        {/* Profesor Button */}
        <button
          type="button"
          onClick={() => setModoActivo('profesor')}
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors select-none cursor-pointer ${
            modoActivo === 'profesor' ? 'text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Profesor</span>
        </button>
      </div>
    </div>
  );
}
