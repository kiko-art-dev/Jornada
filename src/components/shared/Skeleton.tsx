export function SkeletonLine({ width = '100%' }: { width?: string }) {
  return (
    <div
      className="h-3 animate-pulse rounded bg-[var(--color-surface-hover)]"
      style={{ width }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-card)] px-3.5 py-3 space-y-2">
      <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-surface-hover)]" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--color-surface-hover)]" />
      <div className="flex gap-2">
        <div className="h-5 w-12 animate-pulse rounded bg-[var(--color-surface-hover)]" />
        <div className="h-5 w-16 animate-pulse rounded bg-[var(--color-surface-hover)]" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] h-[42px] px-4">
      <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--color-surface-hover)]" />
      <div className="h-4 w-16 animate-pulse rounded bg-[var(--color-surface-hover)]" />
      <div className="h-4 w-12 animate-pulse rounded bg-[var(--color-surface-hover)]" />
      <div className="h-4 w-20 animate-pulse rounded bg-[var(--color-surface-hover)]" />
    </div>
  )
}
