import { useMemo, useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { useTaskStore } from '../../stores/taskStore'
import { useUIStore } from '../../stores/uiStore'
import type { Task } from '../../types'

interface Props {
  projectId: string
  taskFilter?: (task: Task) => boolean
}

export function CalendarView({ projectId, taskFilter }: Props) {
  const allTasks = useTaskStore((s) => s.tasks)
  const openDrawer = useUIStore((s) => s.openDrawer)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const tasks = useMemo(() => {
    const base = allTasks.filter((t) => t.project_id === projectId && t.due_date)
    return taskFilter ? base.filter(taskFilter) : base
  }, [allTasks, projectId, taskFilter])

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasks.forEach((task) => {
      if (!task.due_date) return
      const key = task.due_date.slice(0, 10)
      const existing = map.get(key) ?? []
      existing.push(task)
      map.set(key, existing)
    })
    return map
  }, [tasks])

  const priorityColor = (p: number) => {
    if (p === 1) return 'bg-red-500/80'
    if (p === 2) return 'bg-orange-500/80'
    if (p === 3) return 'bg-yellow-500/80'
    return 'bg-brand-500/60'
  }

  return (
    <div className="flex h-full flex-col p-5">
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-tertiary)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-tertiary)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 grid-cols-7 gap-px overflow-hidden rounded-lg border border-[var(--border-subtle)]">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDate.get(key) ?? []
          const inMonth = isSameMonth(day, currentMonth)
          const today = isToday(day)

          return (
            <div
              key={key}
              className={`min-h-[80px] border-b border-r border-[var(--border-subtle)] p-1 ${
                inMonth ? 'bg-[var(--color-surface-card)]' : 'bg-[var(--color-surface-hover)]/50'
              }`}
            >
              <div className={`mb-1 text-right text-xs ${
                today ? 'font-bold text-brand-400' : inMonth ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
              }`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => openDrawer(task.id)}
                    className={`w-full truncate rounded px-1 py-0.5 text-left text-xs text-white ${priorityColor(task.priority)} hover:brightness-110`}
                  >
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="block text-center text-xs text-[var(--text-tertiary)]">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
