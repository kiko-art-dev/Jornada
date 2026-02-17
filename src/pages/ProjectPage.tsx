import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '../stores/projectStore'
import { useTaskStore } from '../stores/taskStore'
import { useUIStore } from '../stores/uiStore'
import { Board } from '../components/board/Board'
import { ListView } from '../components/list/ListView'
import { CalendarView } from '../components/calendar/CalendarView'
import { ReleasesView } from '../components/releases/ReleasesView'
import { FilterBar, emptyFilters, hasActiveFilters, type Filters } from '../components/shared/FilterBar'
import type { Task, ViewMode } from '../types'

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId))
  const { viewMode, setViewMode } = useUIStore()
  const taskTags = useTaskStore((s) => s.taskTags)

  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [showFilters, setShowFilters] = useState(false)

  // All hooks must be above the early return
  const buildTaskFilter = useCallback(
    (): ((task: Task) => boolean) | undefined => {
      if (!hasActiveFilters(filters)) return undefined

      return (task: Task) => {
        if (filters.priority !== null && task.priority !== filters.priority) return false
        if (filters.type !== null && task.type !== filters.type) return false
        if (filters.releaseId !== null && task.release_id !== filters.releaseId) return false
        if (filters.tagId !== null) {
          const hasTag = taskTags.some((tt) => tt.task_id === task.id && tt.tag_id === filters.tagId)
          if (!hasTag) return false
        }
        if (filters.discipline !== null && task.discipline !== filters.discipline) return false
        return true
      }
    },
    [filters, taskTags]
  )

  const bugsFilter = useCallback(
    (task: Task) => {
      if (task.type !== 'bug') return false
      const userFilter = buildTaskFilter()
      return userFilter ? userFilter(task) : true
    },
    [buildTaskFilter]
  )

  const currentFilter = viewMode === 'bugs' ? bugsFilter : buildTaskFilter()

  const isDevProject = project?.type === 'dev'

  const tabs = useMemo((): { key: ViewMode; label: string }[] => {
    const base: { key: ViewMode; label: string }[] = [
      { key: 'board', label: 'Board' },
      { key: 'list', label: 'List' },
      { key: 'calendar', label: 'Calendar' },
    ]
    if (isDevProject) {
      base.push({ key: 'bugs', label: 'Bugs' })
      base.push({ key: 'releases', label: 'Releases' })
    }
    return base
  }, [isDevProject])

  // Early return AFTER all hooks
  if (!project || !projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[var(--text-tertiary)]">Project not found.</p>
      </div>
    )
  }

  const showBoard = viewMode === 'board' || viewMode === 'bugs'

  return (
    <div className="flex h-full flex-col">
      {/* Project header */}
      <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--color-surface-raised)] px-6 py-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{project.name}</h2>

        <div className="flex items-center gap-3">
          {viewMode !== 'releases' && viewMode !== 'calendar' && (
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`relative flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                showFilters
                  ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                  : 'border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 4h12M4 8h8M6 12h4" />
              </svg>
              Filter
              {hasActiveFilters(filters) && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand-500" />
              )}
            </button>
          )}

          <div className="flex items-center gap-1 rounded-lg bg-[var(--color-surface-hover)] p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium ${
                  viewMode === tab.key
                    ? 'bg-[var(--color-surface-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Collapsible filter bar */}
      {showFilters && viewMode !== 'releases' && viewMode !== 'calendar' && (
        <FilterBar
          projectId={projectId}
          filters={filters}
          onChange={setFilters}
        />
      )}

      {/* View content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'releases' ? (
          <ReleasesView projectId={projectId} />
        ) : viewMode === 'calendar' ? (
          <CalendarView projectId={projectId} taskFilter={currentFilter} />
        ) : showBoard ? (
          <Board projectId={projectId} taskFilter={currentFilter} />
        ) : (
          <ListView projectId={projectId} taskFilter={currentFilter} />
        )}
      </div>
    </div>
  )
}
