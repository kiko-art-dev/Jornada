import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import type { JobApplication, JobStage } from '../../types'
import { JobHuntCard } from './JobHuntCard'

interface Props {
  stage: { value: JobStage; label: string; color: string }
  applications: JobApplication[]
  onSelectApp: (id: string) => void
  onAddStudio: () => void
}

export function JobHuntColumn({ stage, applications, onSelectApp, onAddStudio }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${stage.value}`,
    data: { type: 'column', stage: stage.value },
  })

  const appIds = applications.map((a) => a.id)

  return (
    <div className="flex h-full w-[280px] flex-shrink-0 flex-col rounded-xl bg-[var(--color-surface-column)] p-2.5">
      {/* Column header */}
      <div
        className="mb-2.5 flex items-center gap-2.5 rounded-lg bg-[var(--color-surface-card)] px-3 py-2.5 shadow-sm border border-[var(--border-subtle)]"
        style={{ borderLeft: `3px solid ${stage.color}` }}
      >
        <div
          className="h-3 w-3 flex-shrink-0 rounded-full"
          style={{ backgroundColor: stage.color }}
        />
        <span className="text-sm font-bold text-[var(--text-primary)]">
          {stage.label}
        </span>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
          style={{ backgroundColor: `${stage.color}15`, color: stage.color }}
        >
          {applications.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-1 flex-col gap-2.5 overflow-y-auto rounded-lg transition-colors ${
          isOver ? 'bg-brand-500/[0.06] ring-1 ring-brand-500/20' : ''
        }`}
      >
        <SortableContext items={appIds} strategy={verticalListSortingStrategy}>
          {applications.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <JobHuntCard application={app} onSelect={onSelectApp} />
            </motion.div>
          ))}
        </SortableContext>

        {applications.length === 0 && !isOver && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-[var(--border-default)] py-6">
            <span className="text-xs text-[var(--text-muted)]">Drop studios here</span>
          </div>
        )}
      </div>

      {/* Add studio — pinned at bottom */}
      <div className="flex-shrink-0 pt-2">
        <button
          onClick={onAddStudio}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2z" />
          </svg>
          Add Studio
        </button>
      </div>
    </div>
  )
}
