import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { useProjectStore } from '../../stores/projectStore'
import { useTaskStore } from '../../stores/taskStore'
import type { Task } from '../../types'
import { Column } from './Column'
import { Card } from './Card'
import { SkeletonCard } from '../shared/Skeleton'

interface Props {
  projectId: string
  taskFilter?: (task: Task) => boolean
}

export function Board({ projectId, taskFilter }: Props) {
  const allStatuses = useProjectStore((s) => s.statuses)
  const createStatus = useProjectStore((s) => s.createStatus)
  const allTasks = useTaskStore((s) => s.tasks)
  const loading = useTaskStore((s) => s.loading)
  const updateTask = useTaskStore((s) => s.updateTask)

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [addingStatus, setAddingStatus] = useState(false)
  const [newStatusName, setNewStatusName] = useState('')
  const newStatusRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (addingStatus && newStatusRef.current) newStatusRef.current.focus()
  }, [addingStatus])

  const handleAddStatus = () => {
    const trimmed = newStatusName.trim()
    if (trimmed) {
      const sortOrder = allStatuses.filter((s) => s.project_id === projectId).length
      createStatus({
        name: trimmed,
        project_id: projectId,
        category: 'active',
        color: '#6b7280',
        sort_order: sortOrder,
      })
    }
    setNewStatusName('')
    setAddingStatus(false)
  }

  const statuses = useMemo(
    () => allStatuses.filter((s) => s.project_id === projectId).sort((a, b) => a.sort_order - b.sort_order),
    [allStatuses, projectId]
  )

  const projectTasks = useMemo(
    () => {
      const base = allTasks.filter((t) => t.project_id === projectId)
      return taskFilter ? base.filter(taskFilter) : base
    },
    [allTasks, projectId, taskFilter]
  )

  const getTasksByStatus = useCallback(
    (statusId: string) =>
      projectTasks.filter((t) => t.status_id === statusId).sort((a, b) => a.sort_order - b.sort_order),
    [projectTasks]
  )

  // Use pointer detection first (for cards), fall back to rect intersection (for empty columns)
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) return pointerCollisions
    return rectIntersection(args)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = projectTasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }, [projectTasks])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    let targetStatusId: string | null = null

    if (overId.startsWith('column-')) {
      targetStatusId = overId.replace('column-', '')
    } else {
      const overTask = projectTasks.find((t) => t.id === overId)
      if (overTask) targetStatusId = overTask.status_id
    }

    if (!targetStatusId) return

    const draggedTask = projectTasks.find((t) => t.id === activeId)
    if (draggedTask && draggedTask.status_id !== targetStatusId) {
      updateTask(activeId, { status_id: targetStatusId })
    }
  }, [projectTasks, updateTask])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTask(null)

    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    if (!overId.startsWith('column-')) {
      const overTask = projectTasks.find((t) => t.id === overId)
      const draggedTask = projectTasks.find((t) => t.id === activeId)
      if (draggedTask && overTask && draggedTask.status_id === overTask.status_id) {
        updateTask(activeId, { sort_order: overTask.sort_order })
      }
    }
  }, [projectTasks, updateTask])

  if (loading) {
    return (
      <div className="flex h-full gap-4 overflow-x-auto p-6">
        {Array.from({ length: 3 }).map((_, col) => (
          <div key={col} className="flex w-72 flex-shrink-0 flex-col gap-2">
            <div className="mb-2 h-4 w-20 animate-pulse rounded bg-[var(--color-surface-hover)]" />
            {Array.from({ length: 3 - col }).map((_, row) => (
              <SkeletonCard key={row} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (statuses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[var(--text-tertiary)]">No statuses configured for this project.</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto p-6">
        {statuses.map((status) => (
          <Column
            key={status.id}
            status={status}
            tasks={getTasksByStatus(status.id)}
            projectId={projectId}
          />
        ))}

        {/* Ghost column — add new status */}
        <div className="flex h-full w-72 flex-shrink-0 flex-col">
          {addingStatus ? (
            <div className="mb-2 px-1">
              <input
                ref={newStatusRef}
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                onBlur={handleAddStatus}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddStatus()
                  if (e.key === 'Escape') { setNewStatusName(''); setAddingStatus(false) }
                }}
                placeholder="Status name…"
                className="w-full rounded bg-[var(--color-surface-card)] px-2 py-1 text-sm text-[var(--text-primary)] outline-none ring-1 ring-brand-500 placeholder:text-[var(--text-muted)]"
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingStatus(true)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2z" />
              </svg>
              Add Status
            </button>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? <Card task={activeTask} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
