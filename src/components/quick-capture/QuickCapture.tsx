import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '../../stores/uiStore'
import { useProjectStore } from '../../stores/projectStore'
import { useTaskStore } from '../../stores/taskStore'

const selectClass = 'rounded-lg bg-[var(--color-surface-input)] border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--color-surface-card)] hover:border-[var(--border-default)] hover:shadow-sm focus:bg-[var(--color-surface-card)] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 focus:outline-none transition-all cursor-pointer'

export function QuickCapture() {
  const { quickCaptureOpen, setQuickCaptureOpen } = useUIStore()
  const projects = useProjectStore((s) => s.projects)
  const workspaces = useProjectStore((s) => s.workspaces)
  const statuses = useProjectStore((s) => s.statuses)
  const createTask = useTaskStore((s) => s.createTask)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [statusId, setStatusId] = useState<string>('')

  const activeProjects = useMemo(
    () => projects.filter((p) => !p.archived).sort((a, b) => a.sort_order - b.sort_order),
    [projects]
  )

  const projectStatuses = useMemo(
    () => projectId ? statuses.filter((s) => s.project_id === projectId) : [],
    [statuses, projectId]
  )

  // Auto-select first project if none selected
  useEffect(() => {
    if (quickCaptureOpen && !projectId && activeProjects.length > 0) {
      setProjectId(activeProjects[0].id)
    }
  }, [quickCaptureOpen, activeProjects, projectId])

  // Auto-select default status when project changes
  useEffect(() => {
    if (projectStatuses.length > 0) {
      const defaultStatus = projectStatuses.find((s) => s.is_default) ?? projectStatuses[0]
      setStatusId(defaultStatus.id)
    } else {
      setStatusId('')
    }
  }, [projectId, projectStatuses])

  // Q hotkey to open
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.key === 'q' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault()
        setQuickCaptureOpen(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setQuickCaptureOpen])

  const close = () => {
    setTitle('')
    setDescription('')
    setQuickCaptureOpen(false)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !projectId) return

    await createTask({
      title: title.trim(),
      description: description.trim() || null,
      project_id: projectId,
      status_id: statusId || null,
    })

    setTitle('')
    setDescription('')
    // Keep project/status selection for rapid entry
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      close()
    }
  }

  // Group projects by workspace for the dropdown
  const groupedProjects = useMemo(() => {
    const groups: { wsName: string; projects: typeof activeProjects }[] = []
    const sortedWs = [...workspaces].sort((a, b) => a.sort_order - b.sort_order)
    for (const ws of sortedWs) {
      const wsProjects = activeProjects.filter((p) => p.workspace_id === ws.id)
      if (wsProjects.length > 0) {
        groups.push({ wsName: ws.name, projects: wsProjects })
      }
    }
    return groups
  }, [workspaces, activeProjects])

  return (
    <AnimatePresence>
      {quickCaptureOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-50 bg-black/20"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="fixed left-1/2 top-[18%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-overlay)] p-5 shadow-xl"
          >
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Quick Add Task
            </div>

            {/* Title */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task title..."
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-overlay)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
              autoFocus
            />

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') close() }}
              placeholder="Description (optional)..."
              rows={2}
              className="mt-2 w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-overlay)] px-4 py-2.5 text-xs leading-relaxed text-[var(--text-secondary)] placeholder-[var(--text-muted)] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
            />

            {/* Project + Status selectors */}
            <div className="mt-3 flex items-center gap-2">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={selectClass + ' flex-1'}
              >
                <option value="" disabled>Select board...</option>
                {groupedProjects.map((group) => (
                  <optgroup key={group.wsName} label={group.wsName}>
                    {group.projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className={selectClass + ' flex-1'}
                disabled={!projectId}
              >
                <option value="" disabled>Select column...</option>
                {projectStatuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">Enter to save · Esc to cancel</span>
              <button
                onMouseDown={(e) => { e.preventDefault(); handleSubmit() }}
                disabled={!title.trim() || !projectId}
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Add Task
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
