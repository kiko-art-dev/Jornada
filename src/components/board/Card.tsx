import { useMemo, useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import type { Task } from '../../types'
import { PriorityBadge } from '../shared/PriorityBadge'
import { TagBadge } from '../shared/TagBadge'
import { DisciplineBadge } from '../shared/DisciplineBadge'
import { useUIStore } from '../../stores/uiStore'
import { useTaskStore } from '../../stores/taskStore'
import { useProjectStore } from '../../stores/projectStore'
import { format, isPast, isToday } from 'date-fns'

interface Props {
  task: Task
  isDragOverlay?: boolean
}

export function Card({ task, isDragOverlay }: Props) {
  const openDrawer = useUIStore((s) => s.openDrawer)
  const selectedTaskIds = useUIStore((s) => s.selectedTaskIds)
  const toggleTaskSelected = useUIStore((s) => s.toggleTaskSelected)
  const updateTask = useTaskStore((s) => s.updateTask)
  const allTaskTags = useTaskStore((s) => s.taskTags)
  const tags = useProjectStore((s) => s.tags)
  const statuses = useProjectStore((s) => s.statuses)
  const taskDependencies = useTaskStore((s) => s.taskDependencies)
  const tasks = useTaskStore((s) => s.tasks)

  const allChecklistItems = useTaskStore((s) => s.checklistItems)
  const allAttachments = useTaskStore((s) => s.taskAttachments)

  const isSelected = selectedTaskIds.has(task.id)
  const anySelected = selectedTaskIds.size > 0

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDesc, setEditDesc] = useState(task.description ?? '')
  const titleRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // Sync when task changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditTitle(task.title)
      setEditDesc(task.description ?? '')
    }
  }, [task.title, task.description, isEditing])

  // Focus title when entering edit mode
  useEffect(() => {
    if (isEditing) titleRef.current?.focus()
  }, [isEditing])

  // Click outside to save
  useEffect(() => {
    if (!isEditing) return
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        handleSave()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditing, editTitle, editDesc])

  const handleSave = () => {
    setIsEditing(false)
    const trimmedTitle = editTitle.trim()
    const trimmedDesc = editDesc.trim()
    const updates: Partial<Task> = {}
    if (trimmedTitle && trimmedTitle !== task.title) updates.title = trimmedTitle
    if (trimmedDesc !== (task.description ?? '')) updates.description = trimmedDesc || null
    if (Object.keys(updates).length > 0) updateTask(task.id, updates)
    if (!trimmedTitle) setEditTitle(task.title)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditTitle(task.title)
      setEditDesc(task.description ?? '')
      setIsEditing(false)
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    handleEditKeyDown(e)
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  const taskTagList = useMemo(() => {
    const tagIds = allTaskTags.filter((tt) => tt.task_id === task.id).map((tt) => tt.tag_id)
    return tagIds.map((id) => tags.find((t) => t.id === id)).filter(Boolean) as typeof tags
  }, [allTaskTags, tags, task.id])

  const checklistStats = useMemo(() => {
    const items = allChecklistItems.filter((c) => c.task_id === task.id)
    if (items.length === 0) return null
    return { done: items.filter((c) => c.checked).length, total: items.length }
  }, [allChecklistItems, task.id])

  const taskAttachments = useMemo(
    () => allAttachments.filter((a) => a.task_id === task.id),
    [allAttachments, task.id]
  )
  const coverImage = taskAttachments[0]?.file_url ?? null

  const isBlocked = useMemo(() => {
    const deps = taskDependencies.filter((d) => d.task_id === task.id)
    if (deps.length === 0) return false
    return deps.some((dep) => {
      const depTask = tasks.find((t) => t.id === dep.depends_on_task_id)
      if (!depTask) return false
      const status = statuses.find((s) => s.id === depTask.status_id)
      return status?.category !== 'done'
    })
  }, [taskDependencies, task.id, tasks, statuses])

  const taskChecklist = useMemo(
    () => allChecklistItems.filter((c) => c.task_id === task.id).sort((a, b) => a.sort_order - b.sort_order),
    [allChecklistItems, task.id]
  )

  const toggleChecklistItem = useTaskStore((s) => s.toggleChecklistItem)
  const [checklistOpen, setChecklistOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task },
    disabled: isDragOverlay || isEditing,
  })

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0.4 : 1,
  }

  const dueDateColor = task.due_date
    ? isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
      ? 'text-red-400'
      : isToday(new Date(task.due_date))
        ? 'text-orange-400'
        : 'text-[var(--text-tertiary)]'
    : ''

  const hasDescription = !!task.description
  const hasMeta = checklistStats || isBlocked || task.recurrence_rule ||
    task.priority <= 3 || taskTagList.length > 0 || task.discipline ||
    task.due_date || task.type === 'bug' || taskAttachments.length > 0

  if (isDragOverlay) {
    return (
      <div className="w-[268px] cursor-grabbing rounded-xl border border-brand-500/40 bg-[var(--color-surface-card)] p-4 shadow-xl shadow-black/15">
        <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{task.title}</p>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isEditing ? {} : listeners)}
      onClick={() => {
        if (!isDragging && !isEditing) setIsEditing(true)
      }}
      className={`group/card relative cursor-pointer rounded-xl border bg-[var(--color-surface-card)] shadow-sm hover:border-[var(--border-default)] hover:-translate-y-px hover:shadow-md transition-all ${
        isSelected ? 'border-brand-500 ring-1 ring-brand-500/30' : isEditing ? 'border-brand-400 ring-1 ring-brand-400/30' : 'border-[var(--border-subtle)]'
      }`}
    >
      {coverImage && (
        <div className="overflow-hidden rounded-t-xl">
          <img src={coverImage} alt="" className="h-28 w-full object-cover" />
        </div>
      )}
      <div ref={formRef} className="p-4">
        {/* Title + description */}
        <div className="flex items-start gap-2">
          {(anySelected || isSelected) && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => { e.stopPropagation(); toggleTaskSelected(task.id) }}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-[var(--border-default)] bg-[var(--color-surface-card)] accent-brand-500"
            />
          )}
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <>
                <input
                  ref={titleRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-transparent text-sm font-semibold text-[var(--text-primary)] leading-snug focus:outline-none"
                  placeholder="Task title..."
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Add a description..."
                  rows={2}
                  className="mt-1 w-full resize-none bg-transparent text-xs leading-relaxed text-[var(--text-tertiary)] placeholder-[var(--text-muted)] focus:outline-none"
                />
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{task.title}</p>
                {task.description && (
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)] line-clamp-2">{task.description}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Meta section — separated from title */}
        {hasMeta && !isEditing && (
          <div className="mt-3 border-t border-[var(--border-subtle)] pt-3 space-y-2">
            {/* Checklist indicator */}
            {checklistStats && (
              <div className="flex items-center gap-2.5 text-xs text-[var(--text-tertiary)]">
                <button
                  onClick={(e) => { e.stopPropagation(); setChecklistOpen(!checklistOpen) }}
                  className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-[var(--color-surface-hover)] ${
                    checklistStats.done === checklistStats.total ? 'text-green-500' : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="12" height="12" rx="2" />
                    <path d="m5 8 2 2 4-4" />
                  </svg>
                  {checklistStats.done}/{checklistStats.total}
                </button>
              </div>
            )}

            {/* Blocked + recurrence */}
            {(isBlocked || task.recurrence_rule) && (
              <div className="flex items-center gap-2">
                {isBlocked && (
                  <span className="rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-500 border border-orange-200">Blocked</span>
                )}
                {task.recurrence_rule && (
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-500 border border-brand-200">Recurring</span>
                )}
              </div>
            )}

            {/* Inline checklist */}
            {checklistOpen && taskChecklist.length > 0 && (
              <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                {taskChecklist.map((item) => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs hover:bg-[var(--color-surface-hover)]"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecklistItem(item.id)}
                      className="h-3.5 w-3.5 rounded border-[var(--border-default)] bg-[var(--color-surface-card)] accent-brand-500"
                    />
                    <span className={item.checked ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-secondary)]'}>
                      {item.title}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Priority + tags + discipline */}
            {(task.priority <= 3 || taskTagList.length > 0 || task.discipline) && (
              <div className="flex flex-wrap items-center gap-2">
                {task.discipline && <DisciplineBadge discipline={task.discipline} />}
                {task.priority <= 3 && <PriorityBadge priority={task.priority} />}
                {taskTagList.slice(0, 3).map((tag) => (
                  <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                ))}
              </div>
            )}

            {/* Due date + type + attachments */}
            {(task.due_date || task.type === 'bug' || taskAttachments.length > 0) && (
              <div className="flex items-center gap-3 text-xs">
                {task.due_date && (
                  <span className={`flex items-center gap-1 ${dueDateColor}`}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2.5" width="12" height="11" rx="2" />
                      <path d="M5 1v3M11 1v3M2 6h12" />
                    </svg>
                    {format(new Date(task.due_date), 'MMM d')}
                  </span>
                )}
                {task.type === 'bug' && (
                  <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-500 border border-red-200">Bug</span>
                )}
                {taskAttachments.length > 0 && (
                  <span className="flex items-center gap-1 text-[var(--text-muted)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    {taskAttachments.length}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Open drawer icon — top right on hover */}
      {!isEditing && !anySelected && (
        <button
          onClick={(e) => { e.stopPropagation(); openDrawer(task.id) }}
          className="absolute top-3 right-3 hidden rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)] group-hover/card:block transition-colors"
          title="Open details"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        </button>
      )}

      {/* Hover checkbox when none selected and not editing */}
      {!anySelected && !isSelected && !isEditing && (
        <div
          className="absolute top-3 right-10 hidden group-hover/card:block"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={false}
            onChange={() => toggleTaskSelected(task.id)}
            className="h-4 w-4 rounded border-[var(--border-default)] bg-[var(--color-surface-card)] accent-brand-500"
          />
        </div>
      )}
    </div>
  )
}
