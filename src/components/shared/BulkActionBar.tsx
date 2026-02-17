import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '../../stores/uiStore'
import { useTaskStore } from '../../stores/taskStore'
import { useProjectStore } from '../../stores/projectStore'
import { DISCIPLINE_LIST, type Discipline } from '../../lib/discipline'
import { useState } from 'react'
import type { Priority } from '../../types'

export function BulkActionBar() {
  const selectedTaskIds = useUIStore((s) => s.selectedTaskIds)
  const clearSelection = useUIStore((s) => s.clearSelection)
  const updateTask = useTaskStore((s) => s.updateTask)
  const archiveTask = useTaskStore((s) => s.archiveTask)
  const projects = useProjectStore((s) => s.projects)
  const statuses = useProjectStore((s) => s.statuses)

  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const [showDisciplineMenu, setShowDisciplineMenu] = useState(false)

  const count = selectedTaskIds.size

  const handleSetPriority = (priority: Priority) => {
    selectedTaskIds.forEach((id) => updateTask(id, { priority }))
    setShowPriorityMenu(false)
    clearSelection()
  }

  const handleMoveToProject = (projectId: string) => {
    const defaultStatus = statuses.find((s) => s.project_id === projectId && s.is_default)
      ?? statuses.find((s) => s.project_id === projectId)
    selectedTaskIds.forEach((id) => updateTask(id, {
      project_id: projectId,
      status_id: defaultStatus?.id ?? null,
    }))
    setShowMoveMenu(false)
    clearSelection()
  }

  const handleSetDiscipline = (discipline: Discipline | null) => {
    selectedTaskIds.forEach((id) => updateTask(id, { discipline }))
    setShowDisciplineMenu(false)
    clearSelection()
  }

  const handleArchiveAll = () => {
    selectedTaskIds.forEach((id) => archiveTask(id))
    clearSelection()
  }

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--color-surface-card)] px-5 py-3.5 shadow-xl shadow-black/10">
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">
              {count} selected
            </span>

            <div className="h-4 w-px bg-[var(--border-default)]" />

            {/* Priority */}
            <div className="relative">
              <button
                onClick={() => { setShowPriorityMenu(!showPriorityMenu); setShowMoveMenu(false) }}
                className="rounded-md px-3 py-1.5 text-[13px] text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-primary)]"
              >
                Priority
              </button>
              {showPriorityMenu && (
                <div className="popover absolute bottom-full left-0 mb-2 w-32 rounded-lg py-1">
                  {([1, 2, 3, 4] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSetPriority(p)}
                      className="flex w-full items-center px-3 py-1.5 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      {p === 1 ? 'Urgent' : p === 2 ? 'High' : p === 3 ? 'Medium' : 'Low'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Move */}
            <div className="relative">
              <button
                onClick={() => { setShowMoveMenu(!showMoveMenu); setShowPriorityMenu(false) }}
                className="rounded-md px-3 py-1.5 text-[13px] text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-primary)]"
              >
                Move
              </button>
              {showMoveMenu && (
                <div className="popover absolute bottom-full left-0 mb-2 max-h-48 w-48 overflow-y-auto rounded-lg py-1">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleMoveToProject(p.id)}
                      className="flex w-full items-center px-3 py-1.5 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Discipline */}
            <div className="relative">
              <button
                onClick={() => { setShowDisciplineMenu(!showDisciplineMenu); setShowPriorityMenu(false); setShowMoveMenu(false) }}
                className="rounded-md px-3 py-1.5 text-[13px] text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-primary)]"
              >
                Discipline
              </button>
              {showDisciplineMenu && (
                <div className="popover absolute bottom-full left-0 mb-2 w-36 rounded-lg py-1">
                  <button
                    onClick={() => handleSetDiscipline(null)}
                    className="flex w-full items-center px-3 py-1.5 text-[13px] text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)]"
                  >
                    None
                  </button>
                  {DISCIPLINE_LIST.map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleSetDiscipline(key)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Archive */}
            <button
              onClick={handleArchiveAll}
              className="rounded-md px-3 py-1.5 text-[13px] text-red-400 hover:bg-red-500/10"
            >
              Archive
            </button>

            <div className="h-4 w-px bg-[var(--border-default)]" />

            <button
              onClick={clearSelection}
              className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
