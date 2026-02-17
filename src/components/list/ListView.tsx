import { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { useTaskStore } from '../../stores/taskStore'
import { useProjectStore } from '../../stores/projectStore'
import { useUIStore } from '../../stores/uiStore'
import { PriorityBadge } from '../shared/PriorityBadge'
import { StatusBadge, StatusIcon } from '../shared/StatusBadge'
import { DisciplineBadge } from '../shared/DisciplineBadge'
import { SkeletonRow } from '../shared/Skeleton'
import { format } from 'date-fns'
import type { Task, Status } from '../../types'
import { AddCard } from '../board/AddCard'

interface Props {
  projectId: string
  taskFilter?: (task: Task) => boolean
}

function SortableRow({ task, children }: { task: Task; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(0, ${Math.round(transform.y)}px, 0)` : undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center h-[42px] border-b border-[var(--border-subtle)] hover:bg-[var(--color-surface-hover)]">
      <div className="w-8 px-1 flex items-center justify-center">
        <button {...listeners} className="cursor-grab p-1 text-[var(--text-muted)] hover:text-[var(--text-tertiary)]">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  )
}

export function ListView({ projectId, taskFilter }: Props) {
  const allTasks = useTaskStore((s) => s.tasks)
  const updateTask = useTaskStore((s) => s.updateTask)
  const loading = useTaskStore((s) => s.loading)
  const allStatuses = useProjectStore((s) => s.statuses)
  const openDrawer = useUIStore((s) => s.openDrawer)
  const selectedTaskIds = useUIStore((s) => s.selectedTaskIds)
  const toggleTaskSelected = useUIStore((s) => s.toggleTaskSelected)
  const selectAllTasks = useUIStore((s) => s.selectAllTasks)
  const clearSelection = useUIStore((s) => s.clearSelection)

  const tasks = useMemo(
    () => {
      const base = allTasks.filter((t) => t.project_id === projectId)
      return taskFilter ? base.filter(taskFilter) : base
    },
    [allTasks, projectId, taskFilter]
  )

  const statuses = useMemo(
    () => allStatuses.filter((s) => s.project_id === projectId).sort((a, b) => a.sort_order - b.sort_order),
    [allStatuses, projectId]
  )

  const defaultStatusId = statuses.find((s) => s.is_default)?.id ?? statuses[0]?.id ?? ''

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    const groups: { status: Status; tasks: Task[] }[] = []
    for (const status of statuses) {
      const statusTasks = tasks
        .filter((t) => t.status_id === status.id)
        .sort((a, b) => a.sort_order - b.sort_order)
      groups.push({ status, tasks: statusTasks })
    }
    // Include tasks with no matching status (shouldn't happen but defensive)
    const orphans = tasks.filter((t) => !statuses.some((s) => s.id === t.status_id))
    if (orphans.length > 0 && statuses[0]) {
      const first = groups[0]
      if (first) first.tasks = [...first.tasks, ...orphans]
    }
    return groups
  }, [tasks, statuses])

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggleCollapse = (statusId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(statusId)) next.delete(statusId)
      else next.add(statusId)
      return next
    })
  }

  const allTaskIds = tasks.map((t) => t.id)
  const allSelected = tasks.length > 0 && tasks.every((t) => selectedTaskIds.has(t.id))

  const handleSelectAll = () => {
    if (allSelected) clearSelection()
    else selectAllTasks(allTaskIds)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const allSorted = useMemo(() => groupedTasks.flatMap((g) => g.tasks), [groupedTasks])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = allSorted.findIndex((t) => t.id === active.id)
    const newIndex = allSorted.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(allSorted, oldIndex, newIndex)
    reordered.forEach((task, i) => {
      if (task.sort_order !== i) {
        updateTask(task.id, { sort_order: i })
      }
    })
  }, [allSorted, updateTask])

  if (loading) {
    return (
      <div className="p-4 space-y-0">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="overflow-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-card)] shadow-sm">
          {/* Sticky column header */}
          <div className="sticky top-0 z-10 flex items-center h-[36px] border-b border-[var(--border-subtle)] bg-[var(--color-surface-hover)] text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            <div className="w-8" />
            <div className="w-8 flex items-center justify-center px-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="h-3.5 w-3.5 rounded border-[var(--border-default)] bg-[var(--color-surface-card)] accent-brand-500"
              />
            </div>
            <div className="flex-1 px-3">Title</div>
            <div className="w-28 px-3">Status</div>
            <div className="w-24 px-3">Priority</div>
            <div className="w-24 px-3">Due Date</div>
            <div className="w-24 px-3">Discipline</div>
          </div>

          {/* Grouped sections */}
          <SortableContext items={allSorted.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {groupedTasks.map(({ status, tasks: groupTasks }) => {
              const isCollapsed = collapsed.has(status.id)
              return (
                <div key={status.id}>
                  {/* Group header */}
                  <button
                    onClick={() => toggleCollapse(status.id)}
                    className="flex w-full items-center gap-2 h-[36px] px-3 bg-[var(--color-surface-base)] hover:bg-[var(--color-surface-hover)] border-b border-[var(--border-subtle)]"
                  >
                    <svg
                      width="12" height="12" viewBox="0 0 16 16" fill="currentColor"
                      className={`text-[var(--text-tertiary)] transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    >
                      <path d="M6 3l5 5-5 5V3z" />
                    </svg>
                    <StatusBadge name={status.name} color={status.color} category={status.category} />
                    <span className="text-[12px] tabular-nums text-[var(--text-tertiary)]">{groupTasks.length}</span>
                  </button>

                  {/* Rows */}
                  {!isCollapsed && groupTasks.map((task) => (
                    <SortableRow key={task.id} task={task}>
                      <div className="w-8 flex items-center justify-center px-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.has(task.id)}
                          onChange={() => toggleTaskSelected(task.id)}
                          className="h-3.5 w-3.5 rounded border-[var(--border-default)] bg-[var(--color-surface-card)] accent-brand-500"
                        />
                      </div>
                      <div
                        onClick={() => openDrawer(task.id)}
                        className="flex-1 cursor-pointer truncate px-3 text-sm text-[var(--text-primary)]"
                      >
                        {task.title}
                      </div>
                      <div className="w-28 px-3" onClick={() => openDrawer(task.id)}>
                        <StatusBadge name={status.name} color={status.color} category={status.category} />
                      </div>
                      <div className="w-24 px-3" onClick={() => openDrawer(task.id)}>
                        <PriorityBadge priority={task.priority} size="md" />
                      </div>
                      <div className="w-24 px-3 text-[12px] text-[var(--text-tertiary)]" onClick={() => openDrawer(task.id)}>
                        {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '\u2014'}
                      </div>
                      <div className="w-24 px-3" onClick={() => openDrawer(task.id)}>
                        {task.discipline && <DisciplineBadge discipline={task.discipline} />}
                      </div>
                    </SortableRow>
                  ))}

                  {!isCollapsed && groupTasks.length === 0 && (
                    <div className="flex items-center h-[42px] border-b border-[var(--border-subtle)] px-12 text-[13px] text-[var(--text-muted)]">
                      No tasks
                    </div>
                  )}
                </div>
              )
            })}
          </SortableContext>
        </div>
      </DndContext>

      <div className="mt-3">
        <AddCard projectId={projectId} statusId={defaultStatusId} />
      </div>
    </div>
  )
}
