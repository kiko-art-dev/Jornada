import { useState, useRef, useEffect } from 'react'
import { useTaskStore } from '../stores/taskStore'
import { useProjectStore } from '../stores/projectStore'
import { useUIStore } from '../stores/uiStore'
import { PriorityBadge } from '../components/shared/PriorityBadge'
import { SkeletonLine } from '../components/shared/Skeleton'
import { format } from 'date-fns'

export function InboxPage() {
  const tasks = useTaskStore((s) => s.tasks)
  const loading = useTaskStore((s) => s.loading)
  const updateTask = useTaskStore((s) => s.updateTask)
  const archiveTask = useTaskStore((s) => s.archiveTask)
  const openDrawer = useUIStore((s) => s.openDrawer)
  const workspaces = useProjectStore((s) => s.workspaces)
  const projects = useProjectStore((s) => s.projects)
  const statuses = useProjectStore((s) => s.statuses)

  const inboxTasks = tasks
    .filter((t) => t.project_id === null)
    .sort((a, b) => a.sort_order - b.sort_order)

  // Track which task has the "move to project" dropdown open
  const [moveOpenFor, setMoveOpenFor] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoveOpenFor(null)
      }
    }
    if (moveOpenFor) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [moveOpenFor])

  function moveToProject(taskId: string, projectId: string) {
    const defaultStatus = statuses.find(
      (s) => s.project_id === projectId && s.is_default
    ) ?? statuses.find((s) => s.project_id === projectId)

    updateTask(taskId, {
      project_id: projectId,
      status_id: defaultStatus?.id ?? null,
    })
    setMoveOpenFor(null)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-6">
        <h2 className="text-2xl font-bold text-neutral-900">Inbox</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Tasks captured via Quick Add without a project land here. Triage them into projects.
        </p>
        <div className="mt-6 space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-raised)] px-4 py-3.5">
              <SkeletonLine width={i % 2 === 0 ? '55%' : '40%'} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <h2 className="text-2xl font-bold text-neutral-900">Inbox</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Tasks captured via Quick Add without a project land here. Triage them into projects.
      </p>

      {inboxTasks.length === 0 ? (
        <div className="mt-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-raised)] p-8 text-center">
          <p className="text-neutral-500">No tasks in inbox.</p>
          <p className="mt-1 text-[12px] text-neutral-400">
            Press <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-400">Q</kbd> to quick-add a task without a #project.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-1">
          {inboxTasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3.5 shadow-sm hover:border-[var(--border-default)] hover:shadow-md"
            >
              {/* Priority */}
              {task.priority <= 3 && (
                <div className="flex-shrink-0">
                  <PriorityBadge priority={task.priority} />
                </div>
              )}

              {/* Title — click to open drawer */}
              <button
                onClick={() => openDrawer(task.id)}
                className="min-w-0 flex-1 text-left text-sm text-neutral-800 hover:text-neutral-900"
              >
                <span className="truncate block">{task.title}</span>
              </button>

              {/* Due date */}
              {task.due_date && (
                <span className="flex-shrink-0 text-[12px] text-neutral-500">
                  {format(new Date(task.due_date), 'MMM d')}
                </span>
              )}

              {/* Actions — visible on hover */}
              <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {/* Move to project */}
                <div className="relative" ref={moveOpenFor === task.id ? dropdownRef : undefined}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMoveOpenFor(moveOpenFor === task.id ? null : task.id)
                    }}
                    title="Move to project"
                    className="rounded p-1 text-neutral-400 hover:bg-[var(--color-surface-hover)] hover:text-neutral-600"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z" />
                    </svg>
                  </button>

                  {moveOpenFor === task.id && (
                    <div className="popover absolute right-0 top-8 z-50 w-56 rounded-lg py-1">
                      <p className="px-3 pb-1 pt-1.5 text-[12px] font-medium text-neutral-400">Move to project</p>
                      {workspaces.map((ws) => {
                        const wsProjects = projects.filter((p) => p.workspace_id === ws.id)
                        if (wsProjects.length === 0) return null
                        return (
                          <div key={ws.id}>
                            <p className="px-3 pt-2 text-[11px] text-neutral-400">{ws.name}</p>
                            {wsProjects.map((project) => (
                              <button
                                key={project.id}
                                onClick={() => moveToProject(task.id, project.id)}
                                className="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-neutral-700 hover:bg-[var(--color-surface-hover)]"
                              >
                                {project.name}
                              </button>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Archive */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    archiveTask(task.id)
                  }}
                  title="Archive"
                  className="rounded p-1 text-neutral-500 hover:bg-[var(--color-surface-hover)] hover:text-red-400"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1H2V4zm1 2.5v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-6H3zm3.5 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1H7a.5.5 0 0 1-.5-.5z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
