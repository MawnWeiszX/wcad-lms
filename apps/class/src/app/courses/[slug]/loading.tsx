export default function CourseDetailLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-4 w-24 rounded bg-[var(--color-border)]" />
          <div className="h-10 w-2/3 rounded bg-[var(--color-border)]" />
          <div className="h-5 w-full max-w-lg rounded bg-[var(--color-border)]" />
          <div className="flex gap-4 pt-2">
            <div className="h-4 w-28 rounded bg-[var(--color-border)]" />
            <div className="h-4 w-20 rounded bg-[var(--color-border)]" />
            <div className="h-4 w-24 rounded bg-[var(--color-border)]" />
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3">
                <div className="h-5 w-1/2 rounded bg-[var(--color-border)]" />
                <div className="h-3 w-full rounded bg-[var(--color-border)]" />
                <div className="h-3 w-3/4 rounded bg-[var(--color-border)]" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="aspect-video rounded-2xl bg-[var(--color-border)]" />
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
              <div className="h-10 w-full rounded-xl bg-[var(--color-border)]" />
              <div className="h-4 w-1/2 rounded bg-[var(--color-border)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
