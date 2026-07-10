export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="h-4 w-20 rounded bg-[var(--color-border)] mb-3" />
            <div className="h-8 w-16 rounded bg-[var(--color-border)]" />
          </div>
        ))}
      </div>
      {/* Course cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="aspect-video bg-[var(--color-border)]" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 rounded bg-[var(--color-border)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--color-border)]" />
              <div className="h-2 w-full rounded-full bg-[var(--color-border)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
