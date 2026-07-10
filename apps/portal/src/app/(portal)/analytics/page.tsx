import { BarChart3, TrendingUp } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Estadísticas' };

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Estadísticas</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Análisis detallado de rendimiento de tus cursos.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-white py-28 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-bg)]">
          <BarChart3 className="h-8 w-8 text-[var(--color-primary)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text)]">Estadísticas avanzadas</h3>
        <p className="mt-2 max-w-sm text-sm text-[var(--color-text-secondary)]">
          Gráficas de inscripciones, retención, ingresos por período y progreso de estudiantes.
          Disponible en la próxima fase.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-full bg-[var(--color-accent-bg)] px-4 py-2 text-sm font-medium text-[var(--color-primary)]">
          <TrendingUp className="h-4 w-4" />
          Próximamente — Fase 4
        </div>
      </div>
    </div>
  );
}
