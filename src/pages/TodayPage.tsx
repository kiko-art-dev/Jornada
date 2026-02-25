import { useMemo } from 'react'
import { format, isPast, isToday as isDateToday } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../stores/taskStore'
import { useProjectStore } from '../stores/projectStore'
import { useUIStore } from '../stores/uiStore'
import { useJobHuntStore } from '../stores/jobHuntStore'
import { PriorityBadge } from '../components/shared/PriorityBadge'
import { SkeletonLine } from '../components/shared/Skeleton'
import { SECTION_COLORS } from '../lib/theme'
import { JOB_STAGE_MAP } from '../lib/jobHunt'
import type { Task, JobStage } from '../types'

interface TodaySection {
  title: string
  tasks: Task[]
  style: 'danger' | 'warning' | 'default' | 'muted' | 'success'
}

export function TodayPage() {
  const today = new Date()
  const allTasks = useTaskStore((s) => s.tasks)
  const loading = useTaskStore((s) => s.loading)
  const allStatuses = useProjectStore((s) => s.statuses)
  const projects = useProjectStore((s) => s.projects)
  const tags = useProjectStore((s) => s.tags)
  const taskTags = useTaskStore((s) => s.taskTags)
  const openDrawer = useUIStore((s) => s.openDrawer)

  const sections = useMemo(() => {
    const active = allTasks.filter((t) => {
      const status = allStatuses.find((s) => s.id === t.status_id)
      return status?.category !== 'done' && !t.archived
    })

    const shown = new Set<string>()
    const addToShown = (tasks: Task[]) => tasks.forEach((t) => shown.add(t.id))

    const overdue = active
      .filter((t) => t.due_date && isPast(new Date(t.due_date)) && !isDateToday(new Date(t.due_date)))
      .sort((a, b) => a.priority - b.priority)
    addToShown(overdue)

    const dueToday = active
      .filter((t) => !shown.has(t.id) && t.due_date && isDateToday(new Date(t.due_date)))
      .sort((a, b) => a.priority - b.priority)
    addToShown(dueToday)

    const highPriority = active
      .filter((t) => !shown.has(t.id) && t.priority <= 2)
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5)
    addToShown(highPriority)

    const inProgress = active
      .filter((t) => {
        if (shown.has(t.id)) return false
        const status = allStatuses.find((s) => s.id === t.status_id)
        return status?.category === 'active'
      })
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5)
    addToShown(inProgress)

    const quickWins = active
      .filter((t) => {
        if (shown.has(t.id)) return false
        const tTagIds = taskTags.filter((tt) => tt.task_id === t.id).map((tt) => tt.tag_id)
        return tTagIds.some((id) => tags.find((tag) => tag.id === id)?.name === 'quick-win')
      })
      .slice(0, 3)

    const result: TodaySection[] = []
    if (overdue.length > 0) result.push({ title: 'Overdue', tasks: overdue, style: 'danger' })
    if (dueToday.length > 0) result.push({ title: 'Due Today', tasks: dueToday, style: 'warning' })
    if (highPriority.length > 0) result.push({ title: 'High Priority', tasks: highPriority, style: 'default' })
    if (inProgress.length > 0) result.push({ title: 'In Progress', tasks: inProgress, style: 'muted' })
    if (quickWins.length > 0) result.push({ title: 'Quick Wins', tasks: quickWins, style: 'success' })
    return result
  }, [allTasks, allStatuses, taskTags, tags])

  // Job hunt follow-ups
  const applications = useJobHuntStore((s) => s.applications)
  const navigate = useNavigate()

  const jobFollowUps = useMemo(() => {
    const overdue = applications.filter((a) =>
      a.next_action_date && isPast(new Date(a.next_action_date)) && !isDateToday(new Date(a.next_action_date))
    )
    const dueToday = applications.filter((a) =>
      a.next_action_date && isDateToday(new Date(a.next_action_date))
    )
    return { overdue, dueToday, total: overdue.length + dueToday.length }
  }, [applications])

  const totalTasks = sections.reduce((sum, s) => sum + s.tasks.length, 0)

  const getProjectName = (projectId: string | null) =>
    projects.find((p) => p.id === projectId)?.name ?? 'Inbox'

  const sectionStyles: Record<string, string> = {
    danger: 'text-red-500',
    warning: 'text-orange-500',
    default: 'text-[var(--text-secondary)]',
    muted: 'text-[var(--text-tertiary)]',
    success: 'text-green-500',
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Today</h2>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-raised)] px-3.5 py-3">
              <SkeletonLine width={i % 2 === 0 ? '60%' : '45%'} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Today</h2>
      <p className="mt-1 text-sm text-[var(--text-tertiary)]">
        {format(today, 'EEEE, MMMM d')}
        {totalTasks > 0
          ? ` — ${totalTasks} task${totalTasks !== 1 ? 's' : ''} to focus on`
          : ' — all clear'}
      </p>

      <div className="mt-8 space-y-8">
        {/* Job hunt follow-ups */}
        {jobFollowUps.total > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-4 w-0.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="12" height="9" rx="1.5" />
                <path d="M5.5 5V3.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V5" />
                <path d="M2 9h12" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                Job Follow-ups
              </span>
              <span className="rounded-full bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-[11px] text-[var(--text-tertiary)]">
                {jobFollowUps.total}
              </span>
            </div>
            <div className="space-y-1">
              {[...jobFollowUps.overdue, ...jobFollowUps.dueToday].map((app) => {
                const isOverdue = app.next_action_date && isPast(new Date(app.next_action_date)) && !isDateToday(new Date(app.next_action_date))
                const stage = JOB_STAGE_MAP[app.stage as JobStage]
                return (
                  <div
                    key={app.id}
                    onClick={() => navigate('/job-hunt')}
                    className="group flex cursor-pointer items-center gap-3 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-card)] shadow-sm hover:border-[var(--border-default)] hover:shadow-md"
                  >
                    <div className="h-full w-0.5 self-stretch" style={{ backgroundColor: isOverdue ? '#ef4444' : '#f59e0b' }} />
                    <div className="flex flex-1 items-center gap-3 px-3.5 py-3">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: `${stage?.color ?? '#6b7280'}20`, color: stage?.color ?? '#6b7280' }}
                      >
                        {stage?.label ?? app.stage}
                      </span>
                      <span className="flex-1 truncate text-sm text-[var(--text-primary)]">{app.studio_name}</span>
                      {app.position && (
                        <span className="text-[12px] text-[var(--text-tertiary)]">{app.position}</span>
                      )}
                      <span className={`text-[12px] ${isOverdue ? 'text-red-400' : 'text-orange-400'}`}>
                        {app.next_action_date && format(new Date(app.next_action_date), 'MMM d')}
                        {isOverdue && ' (overdue)'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {sections.map((section) => (
          <div key={section.title}>
            <div className="mb-3 flex items-center gap-2">
              <div
                className="h-4 w-0.5 rounded-full"
                style={{ backgroundColor: SECTION_COLORS[section.style] }}
              />
              <span className={`text-xs font-semibold uppercase tracking-wide ${sectionStyles[section.style]}`}>
                {section.title}
              </span>
              <span className="rounded-full bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-[11px] text-[var(--text-tertiary)]">
                {section.tasks.length}
              </span>
            </div>
            <div className="space-y-1">
              {section.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => openDrawer(task.id)}
                  className="group flex cursor-pointer items-center gap-3 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-card)] shadow-sm hover:border-[var(--border-default)] hover:shadow-md"
                >
                  {/* Priority color stripe */}
                  <div
                    className="h-full w-0.5 self-stretch"
                    style={{
                      backgroundColor: task.priority === 1 ? '#ef4444'
                        : task.priority === 2 ? '#f97316'
                        : task.priority === 3 ? '#eab308'
                        : 'transparent'
                    }}
                  />
                  <div className="flex flex-1 items-center gap-3 px-3.5 py-3">
                    <PriorityBadge priority={task.priority} />
                    <span className="flex-1 truncate text-sm text-[var(--text-primary)]">{task.title}</span>
                    <span className="text-[12px] text-[var(--text-tertiary)]">{getProjectName(task.project_id)}</span>
                    {task.due_date && (
                      <span className={`text-[12px] ${
                        isPast(new Date(task.due_date)) && !isDateToday(new Date(task.due_date))
                          ? 'text-red-400'
                          : isDateToday(new Date(task.due_date))
                            ? 'text-orange-400'
                            : 'text-[var(--text-tertiary)]'
                      }`}>
                        {format(new Date(task.due_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-raised)] p-8 text-center">
            <p className="text-[var(--text-tertiary)]">No tasks to show.</p>
            <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
              Press <kbd className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-[11px] text-[var(--text-tertiary)]">Q</kbd> to quickly add a task.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
