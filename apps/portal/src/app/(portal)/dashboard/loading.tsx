export default function PortalDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="h-3 w-16 rounded bg-[var(--color-border)] mb-3" />
            <div className="h-7 w-12 rounded bg-[var(--color-border)]" />
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="h-64 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
      {/* Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="h-12 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[var(--color-border)] px-6 py-4">
            <div className="h-9 w-9 rounded-full bg-[var(--color-border)]" />
            <div className="h-4 w-32 rounded bg-[var(--color-border)]" />
            <div className="ml-auto h-4 w-20 rounded bg-[var(--color-border)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
