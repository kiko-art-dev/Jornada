import { useState, useRef, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Status, Task, StatusCategory } from '../../types'
import { useProjectStore } from '../../stores/projectStore'
import { StatusIcon } from '../shared/StatusBadge'
import { Card } from './Card'
import { AddCard } from './AddCard'

const COLOR_SWATCHES = [
  '#6b7280', '#3b82f6', '#8b5cf6', '#a855f7',
  '#ec4899', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#14b8a6',
]

const CATEGORIES: { value: StatusCategory; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Done' },
]

interface Props {
  status: Status
  tasks: Task[]
  projectId: string
}

export function Column({ status, tasks, projectId }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status.id}`,
    data: { type: 'column', statusId: status.id },
  })

  const updateStatus = useProjectStore((s) => s.updateStatus)
  const deleteStatus = useProjectStore((s) => s.deleteStatus)
  const statuses = useProjectStore((s) => s.statuses)

  const [menuOpen, setMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(status.name)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const renameRef = useRef<HTMLInputElement>(null)

  const projectStatuses = statuses.filter((s) => s.project_id === projectId)
  const isLastStatus = projectStatuses.length <= 1

  useEffect(() => {
    if (isRenaming && renameRef.current) renameRef.current.focus()
  }, [isRenaming])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeAllMenus()
      }
    }
    if (menuOpen || showColorPicker || showCategoryPicker || showDeleteConfirm) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen, showColorPicker, showCategoryPicker, showDeleteConfirm])

  function closeAllMenus() {
    setMenuOpen(false)
    setShowColorPicker(false)
    setShowCategoryPicker(false)
    setShowDeleteConfirm(false)
  }

  function handleRenameSubmit() {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== status.name) {
      updateStatus(status.id, { name: trimmed })
    } else {
      setRenameValue(status.name)
    }
    setIsRenaming(false)
  }

  const taskIds = tasks.map((t) => t.id)

  return (
    <div className="flex h-full w-[280px] flex-shrink-0 flex-col rounded-xl bg-[var(--color-surface-column)] p-2.5">
      {/* Column header */}
      <div
        className="mb-2.5 flex items-center gap-2.5 rounded-lg bg-[var(--color-surface-card)] px-3 py-2.5 shadow-sm border border-[var(--border-subtle)]"
        style={{ borderLeft: `3px solid ${status.color ?? '#a3a3a3'}` }}
      >
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit()
              if (e.key === 'Escape') { setRenameValue(status.name); setIsRenaming(false) }
            }}
            className="flex-1 rounded-md bg-[var(--color-surface-input)] px-2 py-1 text-sm font-semibold text-[var(--text-primary)] outline-none ring-1 ring-brand-500"
          />
        ) : (
          <>
            <div
              className="h-3 w-3 flex-shrink-0 rounded-full"
              style={{ backgroundColor: status.color ?? '#a3a3a3' }}
            />
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {status.name}
            </span>
          </>
        )}
        <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium tabular-nums text-[var(--text-tertiary)]"
          style={{ backgroundColor: `${status.color ?? '#a3a3a3'}15`, color: status.color ?? '#a3a3a3' }}
        >{tasks.length}</span>

        {/* "..." menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { closeAllMenus(); setMenuOpen(!menuOpen) }}
            className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="13" cy="8" r="1.5" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-6 z-50 w-44 popover rounded-lg py-1 shadow-lg">
              <button
                onClick={() => { setMenuOpen(false); setIsRenaming(true) }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)]"
              >
                Rename
              </button>
              <button
                onClick={() => { setMenuOpen(false); setShowColorPicker(true) }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)]"
              >
                Color
              </button>
              <button
                onClick={() => { setMenuOpen(false); setShowCategoryPicker(true) }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)]"
              >
                Category
              </button>
              <div className="my-1 border-t border-[var(--border-subtle)]" />
              <button
                onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true) }}
                disabled={isLastStatus}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-red-400 hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          )}

          {/* Color picker popover */}
          {showColorPicker && (
            <div className="absolute right-0 top-6 z-50 w-44 popover rounded-lg p-3 shadow-lg">
              <p className="mb-2 text-[11px] font-medium text-[var(--text-muted)]">Status color</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { updateStatus(status.id, { color: c }); setShowColorPicker(false) }}
                    className={`h-5 w-5 rounded-full ring-offset-1 ring-offset-[var(--color-surface-overlay)] ${
                      status.color === c ? 'ring-2 ring-brand-400' : 'hover:ring-2 hover:ring-neutral-400'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Category picker popover */}
          {showCategoryPicker && (
            <div className="absolute right-0 top-6 z-50 w-44 popover rounded-lg py-1 shadow-lg">
              <p className="mb-1 px-3 pt-1 text-[11px] font-medium text-[var(--text-muted)]">Category</p>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { updateStatus(status.id, { category: cat.value }); setShowCategoryPicker(false) }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-[var(--color-surface-hover)] ${
                    status.category === cat.value ? 'text-brand-500' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {status.category === cat.value && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
                  )}
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Delete confirmation popover */}
          {showDeleteConfirm && (
            <div className="absolute right-0 top-6 z-50 w-56 popover rounded-lg p-3 shadow-lg">
              <p className="text-[13px] text-[var(--text-secondary)]">
                Delete <strong>{status.name}</strong>? Tasks will be moved to the default status.
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded px-2.5 py-1 text-[12px] text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { deleteStatus(status.id); setShowDeleteConfirm(false) }}
                  className="rounded bg-red-600 px-2.5 py-1 text-[12px] text-white hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-1 flex-col gap-2.5 overflow-y-auto rounded-lg transition-colors ${
          isOver ? 'bg-brand-500/[0.06] ring-1 ring-brand-500/20' : ''
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <Card key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-[var(--border-default)] py-6">
            <span className="text-xs text-[var(--text-muted)]">Drop tasks here</span>
          </div>
        )}

        <AddCard projectId={projectId} statusId={status.id} />
      </div>
    </div>
  )
}
