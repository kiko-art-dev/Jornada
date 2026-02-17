import { useMemo } from 'react'
import { startOfWeek, endOfWeek, isWithinInterval, isPast, isToday } from 'date-fns'
import { useTaskStore } from '../stores/taskStore'
import { useProjectStore } from '../stores/projectStore'
import { PRIORITY_COLORS } from '../lib/theme'
import type { Priority } from '../types'

export function DashboardPage() {
  const allTasks = useTaskStore((s) => s.tasks)
  const statuses = useProjectStore((s) => s.statuses)
  const projects = useProjectStore((s) => s.projects)

  const stats = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)

    // All non-archived tasks (already filtered by store)
    const active = allTasks.filter((t) => {
      const status = statuses.find((s) => s.id === t.status_id)
      return status?.category !== 'done'
    })

    const done = allTasks.filter((t) => {
      const status = statuses.find((s) => s.id === t.status_id)
      return status?.category === 'done'
    })

    const completedThisWeek = done.filter((t) => {
      try {
        return isWithinInterval(new Date(t.updated_at), { start: weekStart, end: weekEnd })
      } catch { return false }
    })

    const overdue = active.filter((t) =>
      t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
    )

    const inProgress = active.filter((t) => {
      const status = statuses.find((s) => s.id === t.status_id)
      return status?.category === 'active'
    })

    return {
      completedThisWeek: completedThisWeek.length,
      overdue: overdue.length,
      totalActive: active.length,
      inProgress: inProgress.length,
    }
  }, [allTasks, statuses])

  // Tasks by priority
  const byPriority = useMemo(() => {
    const counts = [0, 0, 0, 0] // P1, P2, P3, P4
    allTasks.forEach((t) => {
      const status = statuses.find((s) => s.id === t.status_id)
      if (status?.category !== 'done') {
        counts[t.priority - 1]++
      }
    })
    return counts
  }, [allTasks, statuses])

  // Tasks by project
  const byProject = useMemo(() => {
    const map = new Map<string, number>()
    allTasks.forEach((t) => {
      if (!t.project_id) return
      const status = statuses.find((s) => s.id === t.status_id)
      if (status?.category === 'done') return
      map.set(t.project_id, (map.get(t.project_id) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([projectId, count]) => ({
        name: projects.find((p) => p.id === projectId)?.name ?? 'Unknown',
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [allTasks, statuses, projects])

  const maxPriority = Math.max(...byPriority, 1)
  const maxProject = Math.max(...byProject.map((p) => p.count), 1)

  const statCards = [
    { label: 'Completed This Week', value: stats.completedThisWeek, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Overdue', value: stats.overdue, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Total Active', value: stats.totalActive, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'In Progress', value: stats.inProgress, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ]

  const priorities: Priority[] = [1, 2, 3, 4]

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h2>
      <p className="mt-1 text-sm text-[var(--text-tertiary)]">Overview of your tasks and projects</p>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-card)] p-5 shadow-sm`}>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{card.label}</p>
            <p className={`mt-1 text-[24px] font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Tasks by Priority */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-card)] p-5 shadow-sm">
          <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Tasks by Priority</h3>
          <div className="space-y-3">
            {priorities.map((p, i) => (
              <div key={p} className="flex items-center gap-3">
                <span className="w-16 text-[12px] text-[var(--text-tertiary)]">{PRIORITY_COLORS[p].label}</span>
                <div className="flex-1 h-5 rounded bg-[var(--color-surface-hover)] overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${(byPriority[i] / maxPriority) * 100}%`,
                      backgroundColor: PRIORITY_COLORS[p].hex,
                      minWidth: byPriority[i] > 0 ? '8px' : '0',
                    }}
                  />
                </div>
                <span className="w-6 text-right text-[12px] text-[var(--text-tertiary)]">{byPriority[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks by Project */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-card)] p-5 shadow-sm">
          <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Tasks by Project</h3>
          {byProject.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)]">No active project tasks</p>
          ) : (
            <div className="space-y-3">
              {byProject.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-24 truncate text-[12px] text-[var(--text-tertiary)]">{p.name}</span>
                  <div className="flex-1 h-5 rounded bg-[var(--color-surface-hover)] overflow-hidden">
                    <div
                      className="h-full rounded bg-brand-500 transition-all"
                      style={{
                        width: `${(p.count / maxProject) * 100}%`,
                        minWidth: p.count > 0 ? '8px' : '0',
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-[12px] text-[var(--text-tertiary)]">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
