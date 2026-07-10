'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { createClient } from '@wcad/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Props {
  lessonId: string;
  isCompleted: boolean;
}

/**
 * Botón interactivo para marcar/desmarcar una lección como completada.
 * Actualiza lesson_progress en Supabase y refresca la página.
 */
export function LessonCompleteButton({ lessonId, isCompleted }: Props) {
  const [completed, setCompleted] = useState(isCompleted);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    interface Upsertable {
      upsert(values: unknown, options?: unknown): Promise<unknown>;
    }

    if (completed) {
      // Desmarcar: borrar completed_at
      await (supabase.from('lesson_progress') as unknown as Upsertable)
        .upsert(
          { student_id: user.id, lesson_id: lessonId, completed_at: null, watch_seconds: 0 },
          { onConflict: 'student_id,lesson_id' }
        );
    } else {
      // Marcar como completada
      await (supabase.from('lesson_progress') as unknown as Upsertable)
        .upsert(
          { student_id: user.id, lesson_id: lessonId, completed_at: new Date().toISOString() },
          { onConflict: 'student_id,lesson_id' }
        );
    }

    setCompleted(!completed);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 ${
        completed
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]'
      }`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : completed ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <Circle className="h-4 w-4" />
      )}
      {completed ? 'Completada' : 'Marcar completada'}
    </button>
  );
}
