import { useMemo } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { DISCIPLINE_LIST, type Discipline } from '../../lib/discipline'
import type { Priority, TaskType } from '../../types'

export interface Filters {
  priority: Priority | null
  type: TaskType | null
  tagId: string | null
  releaseId: string | null
  discipline: Discipline | null
}

export const emptyFilters: Filters = {
  priority: null,
  type: null,
  tagId: null,
  releaseId: null,
  discipline: null,
}

export function hasActiveFilters(filters: Filters): boolean {
  return filters.priority !== null || filters.type !== null || filters.tagId !== null || filters.releaseId !== null || filters.discipline !== null
}

const selectClass = 'rounded-lg bg-[var(--color-surface-input)] border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--color-surface-card)] hover:border-[var(--border-default)] hover:shadow-sm focus:bg-[var(--color-surface-card)] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 focus:outline-none transition-all cursor-pointer'

interface FilterBarProps {
  projectId: string
  filters: Filters
  onChange: (filters: Filters) => void
}

export function FilterBar({ projectId, filters, onChange }: FilterBarProps) {
  const tags = useProjectStore((s) => s.tags)
  const releases = useProjectStore((s) => s.releases)

  const projectReleases = useMemo(
    () => releases.filter((r) => r.project_id === projectId),
    [releases, projectId]
  )

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value })

  return (
    <div className="flex items-center gap-2.5 bg-[var(--color-surface-card)] px-6 py-3 border-b border-[var(--border-subtle)]">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Filter:</span>

      <select
        value={filters.priority ?? ''}
        onChange={(e) => set('priority', e.target.value ? (Number(e.target.value) as Priority) : null)}
        className={selectClass}
      >
        <option value="">Priority</option>
        <option value="1">Urgent</option>
        <option value="2">High</option>
        <option value="3">Medium</option>
        <option value="4">Low</option>
      </select>

      <select
        value={filters.type ?? ''}
        onChange={(e) => set('type', (e.target.value || null) as TaskType | null)}
        className={selectClass}
      >
        <option value="">Type</option>
        <option value="task">Task</option>
        <option value="bug">Bug</option>
        <option value="feature">Feature</option>
      </select>

      <select
        value={filters.tagId ?? ''}
        onChange={(e) => set('tagId', e.target.value || null)}
        className={selectClass}
      >
        <option value="">Tag</option>
        {tags.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <select
        value={filters.discipline ?? ''}
        onChange={(e) => set('discipline', (e.target.value || null) as Discipline | null)}
        className={selectClass}
      >
        <option value="">Discipline</option>
        {DISCIPLINE_LIST.map(([key, cfg]) => (
          <option key={key} value={key}>{cfg.label}</option>
        ))}
      </select>

      {projectReleases.length > 0 && (
        <select
          value={filters.releaseId ?? ''}
          onChange={(e) => set('releaseId', e.target.value || null)}
          className={selectClass}
        >
          <option value="">Release</option>
          {projectReleases.map((r) => (
            <option key={r.id} value={r.id}>v{r.version}</option>
          ))}
        </select>
      )}

      {hasActiveFilters(filters) && (
        <button
          onClick={() => onChange(emptyFilters)}
          className="rounded-lg px-3 py-2 text-xs font-medium text-brand-500 hover:bg-brand-50 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}
