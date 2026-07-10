export default function CoursesLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Filters */}
      <div className="flex gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 w-32 rounded-xl bg-[var(--color-border)]" />
        ))}
      </div>
      {/* Course grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="aspect-video bg-[var(--color-border)]" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 rounded bg-[var(--color-border)]" />
              <div className="h-3 w-full rounded bg-[var(--color-border)]" />
              <div className="h-3 w-1/3 rounded bg-[var(--color-border)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
