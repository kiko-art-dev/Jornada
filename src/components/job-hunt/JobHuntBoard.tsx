import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { useJobHuntStore } from '../../stores/jobHuntStore'
import { JOB_STAGES } from '../../lib/jobHunt'
import type { JobApplication, JobStage, JobMarket } from '../../types'
import { JobHuntColumn } from './JobHuntColumn'
import { JobHuntCard } from './JobHuntCard'
import { SkeletonCard } from '../shared/Skeleton'

interface Props {
  onSelectApp: (id: string) => void
  loading: boolean
  market: JobMarket
  search: string
  onAddStudio: (stage: JobStage) => void
}

export function JobHuntBoard({ onSelectApp, loading, market, search, onAddStudio }: Props) {
  const allApplications = useJobHuntStore((s) => s.applications)
  const applications = allApplications.filter((a) => a.market === market)
  const moveToStage = useJobHuntStore((s) => s.moveToStage)
  const updateApplication = useJobHuntStore((s) => s.updateApplication)

  const [activeApp, setActiveApp] = useState<JobApplication | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return applications
    const q = search.toLowerCase()
    return applications.filter((a) =>
      a.studio_name.toLowerCase().includes(q) ||
      (a.position?.toLowerCase().includes(q)) ||
      (a.notable_games?.toLowerCase().includes(q)) ||
      (a.locations?.toLowerCase().includes(q))
    )
  }, [applications, search])

  const getByStage = useCallback(
    (stage: JobStage) =>
      filtered
        .filter((a) => a.stage === stage)
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
          return a.sort_order - b.sort_order
        }),
    [filtered]
  )

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
    const app = applications.find((a) => a.id === event.active.id)
    if (app) setActiveApp(app)
  }, [applications])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    let targetStage: JobStage | null = null

    if (overId.startsWith('column-')) {
      targetStage = overId.replace('column-', '') as JobStage
    } else {
      const overApp = applications.find((a) => a.id === overId)
      if (overApp) targetStage = overApp.stage
    }

    if (!targetStage) return

    const draggedApp = applications.find((a) => a.id === activeId)
    if (draggedApp && draggedApp.stage !== targetStage) {
      moveToStage(activeId, targetStage)
    }
  }, [applications, moveToStage])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveApp(null)

    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    if (!overId.startsWith('column-')) {
      const overApp = applications.find((a) => a.id === overId)
      const draggedApp = applications.find((a) => a.id === activeId)
      if (draggedApp && overApp && draggedApp.stage === overApp.stage) {
        updateApplication(activeId, { sort_order: overApp.sort_order })
      }
    }
  }, [applications, updateApplication])

  if (loading) {
    return (
      <div className="flex h-full gap-4 overflow-x-auto p-6">
        {JOB_STAGES.slice(0, 5).map((stage) => (
          <div key={stage.value} className="flex w-[280px] flex-shrink-0 flex-col gap-2">
            <div className="mb-2 h-4 w-20 animate-pulse rounded bg-[var(--color-surface-hover)]" />
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ))}
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
        {JOB_STAGES.map((stage) => (
          <JobHuntColumn
            key={stage.value}
            stage={stage}
            applications={getByStage(stage.value)}
            onSelectApp={onSelectApp}
            onAddStudio={() => onAddStudio(stage.value)}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeApp ? <JobHuntCard application={activeApp} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
