import { useMemo, useState } from 'react'
import { format, isPast, isToday } from 'date-fns'
import { useTaskStore } from '../stores/taskStore'
import { useProjectStore } from '../stores/projectStore'
import { useUIStore } from '../stores/uiStore'
import { PriorityBadge } from '../components/shared/PriorityBadge'
import { StatusBadge } from '../components/shared/StatusBadge'
import type { Priority, TaskType, StatusCategory } from '../types'

const selectClass = 'rounded-lg bg-[var(--color-surface-input)] border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--color-surface-card)] hover:border-[var(--border-default)] hover:shadow-sm focus:bg-[var(--color-surface-card)] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 focus:outline-none transition-all cursor-pointer'

export function SearchPage() {
  const allTasks = useTaskStore((s) => s.tasks)
  const allStatuses = useProjectStore((s) => s.statuses)
  const projects = useProjectStore((s) => s.projects)
  const openDrawer = useUIStore((s) => s.openDrawer)

  const [query, setQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('')
  const [filterType, setFilterType] = useState<TaskType | ''>('')
  const [filterProjectId, setFilterProjectId] = useState('')
  const [filterStatusCategory, setFilterStatusCategory] = useState<StatusCategory | ''>('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const results = useMemo(() => {
    let filtered = allTasks

    // Text search
    if (query.trim()) {
      const lower = query.toLowerCase()
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(lower) ||
        (t.description ?? '').toLowerCase().includes(lower)
      )
    }

    // Priority filter
    if (filterPriority) {
      filtered = filtered.filter((t) => t.priority === Number(filterPriority))
    }

    // Type filter
    if (filterType) {
      filtered = filtered.filter((t) => t.type === filterType)
    }

    // Project filter
    if (filterProjectId) {
      filtered = filtered.filter((t) => t.project_id === filterProjectId)
    }

    // Status category filter
    if (filterStatusCategory) {
      filtered = filtered.filter((t) => {
        const status = allStatuses.find((s) => s.id === t.status_id)
        return status?.category === filterStatusCategory
      })
    }

    // Date range filter
    if (filterDateFrom) {
      filtered = filtered.filter((t) => t.due_date && t.due_date >= filterDateFrom)
    }
    if (filterDateTo) {
      filtered = filtered.filter((t) => t.due_date && t.due_date <= filterDateTo)
    }

    return filtered.slice(0, 100)
  }, [allTasks, query, filterPriority, filterType, filterProjectId, filterStatusCategory, filterDateFrom, filterDateTo, allStatuses])

  const getProjectName = (projectId: string | null) =>
    projects.find((p) => p.id === projectId)?.name ?? 'Inbox'

  const getStatusInfo = (statusId: string | null) => {
    const s = allStatuses.find((st) => st.id === statusId)
    return s ? { name: s.name, color: s.color, category: s.category } : { name: '\u2014', color: null, category: 'backlog' as StatusCategory }
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Search</h2>

      {/* Search input */}
      <div className="mt-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks by title or description..."
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-card)] px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
          autoFocus
        />
      </div>

      {/* Filters row */}
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as Priority | '')}
          className={selectClass}
        >
          <option value="">Any Priority</option>
          <option value="1">Urgent</option>
          <option value="2">High</option>
          <option value="3">Medium</option>
          <option value="4">Low</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TaskType | '')}
          className={selectClass}
        >
          <option value="">Any Type</option>
          <option value="task">Task</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
        </select>

        <select
          value={filterProjectId}
          onChange={(e) => setFilterProjectId(e.target.value)}
          className={selectClass}
        >
          <option value="">Any Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={filterStatusCategory}
          onChange={(e) => setFilterStatusCategory(e.target.value as StatusCategory | '')}
          className={selectClass}
        >
          <option value="">Any Status</option>
          <option value="backlog">Backlog</option>
          <option value="active">Active</option>
          <option value="done">Done</option>
        </select>

        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          placeholder="From"
          className={selectClass}
        />
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          placeholder="To"
          className={selectClass}
        />
      </div>

      {/* Results */}
      <div className="mt-4 text-[12px] text-[var(--text-muted)]">
        {results.length} result{results.length !== 1 ? 's' : ''}
      </div>

      <div className="mt-2 space-y-1">
        {results.map((task) => {
          const statusInfo = getStatusInfo(task.status_id)
          const dueDateColor = task.due_date
            ? isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
              ? 'text-red-400'
              : isToday(new Date(task.due_date))
                ? 'text-orange-400'
                : 'text-[var(--text-tertiary)]'
            : ''

          return (
            <div
              key={task.id}
              onClick={() => openDrawer(task.id)}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-card)] px-4 py-3.5 shadow-sm hover:border-[var(--border-default)] hover:shadow-md"
            >
              <PriorityBadge priority={task.priority} />
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-primary)]">{task.title}</span>
              <span className="flex-shrink-0 text-[12px] text-[var(--text-muted)]">{getProjectName(task.project_id)}</span>
              <StatusBadge name={statusInfo.name} color={statusInfo.color} category={statusInfo.category} />
              {task.due_date && (
                <span className={`flex-shrink-0 text-[12px] ${dueDateColor}`}>
                  {format(new Date(task.due_date), 'MMM d')}
                </span>
              )}
            </div>
          )
        })}
        {results.length === 0 && query && (
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-raised)] p-8 text-center">
            <p className="text-[var(--text-tertiary)]">No tasks match your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
