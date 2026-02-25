import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useJobHuntStore } from '../../stores/jobHuntStore'
import { DAILY_ROUTINE_STEPS } from '../../lib/jobHunt'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dotColor(completed: number, total: number, isToday: boolean): string {
  if (completed === 0) return isToday ? '#1a1d2b' : '#1a1d2b'
  const pct = completed / total
  if (pct >= 1) return '#22c55e'
  if (pct >= 0.5) return '#3b82f6'
  return '#f59e0b'
}

export function DailyRoutinePanel() {
  const routineLogs = useJobHuntStore((s) => s.routineLogs)
  const routineHistory = useJobHuntStore((s) => s.routineHistory)
  const toggleStep = useJobHuntStore((s) => s.toggleRoutineStep)
  const [open, setOpen] = useState(false)

  const doneCount = DAILY_ROUTINE_STEPS.filter((s) => routineLogs[s.key]).length
  const totalCount = DAILY_ROUTINE_STEPS.length

  const timeLeft = DAILY_ROUTINE_STEPS
    .filter((s) => !routineLogs[s.key])
    .reduce((sum, s) => sum + s.timeMinutes, 0)

  // Streak: consecutive days with 100% (not counting today)
  let streak = 0
  for (let i = routineHistory.length - 2; i >= 0; i--) {
    if (routineHistory[i].completed >= routineHistory[i].total) streak++
    else break
  }
  // Include today if 100%
  if (doneCount === totalCount) streak++

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <motion.svg
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          width="12" height="12" viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M6 3l5 5-5 5z" />
        </motion.svg>
        Daily Routine
        <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
          doneCount === totalCount
            ? 'bg-green-500/15 text-green-400'
            : doneCount > 0
              ? 'bg-brand-500/15 text-brand-400'
              : 'bg-[var(--color-surface-hover)] text-[var(--text-muted)]'
        }`}>
          {doneCount}/{totalCount}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-card)] p-5 shadow-sm">

              {/* 7-day streak dots */}
              <div className="mb-4 flex items-center gap-2">
                {routineHistory.map((day) => {
                  const d = new Date(day.date + 'T12:00:00')
                  const dayLabel = DAY_LABELS[d.getDay()]
                  const isToday = day.date === todayStr
                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1">
                      <span className={`text-[9px] font-medium ${isToday ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'}`}>
                        {dayLabel}
                      </span>
                      <motion.div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: dotColor(day.completed, day.total, isToday) }}
                        initial={false}
                        animate={{ scale: isToday ? [1, 1.15, 1] : 1 }}
                        transition={{ duration: 0.4 }}
                        title={`${day.date} — ${day.completed}/${day.total}`}
                      />
                    </div>
                  )
                })}
                {streak > 0 && (
                  <span className="ml-2 text-[10px] font-semibold text-green-400">
                    {streak} day streak
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="mb-1 h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: doneCount === totalCount ? '#22c55e' : '#8b5cf6' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(doneCount / totalCount) * 100}%` }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                />
              </div>
              <p className="mb-4 text-[11px] text-[var(--text-muted)]">
                {doneCount === totalCount
                  ? 'All done for today!'
                  : `~${timeLeft} min remaining`}
              </p>

              {/* Checklist */}
              <div className="space-y-0.5">
                {DAILY_ROUTINE_STEPS.map((step) => {
                  const checked = routineLogs[step.key] || false
                  return (
                    <div
                      key={step.key}
                      className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleStep(step.key)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        <motion.div
                          animate={checked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                          transition={{ duration: 0.25 }}
                        >
                          {checked ? (
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <rect x="1" y="1" width="16" height="16" rx="4" fill="#8b5cf6" />
                              <path d="M5.5 9l2.5 2.5 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <rect x="1" y="1" width="16" height="16" rx="4" stroke="var(--text-muted)" strokeWidth="1.5" />
                            </svg>
                          )}
                        </motion.div>
                      </button>

                      {/* Label + links */}
                      <div className="flex-1 min-w-0">
                        <span className={`text-[13px] leading-tight transition-all ${
                          checked
                            ? 'line-through text-[var(--text-muted)]'
                            : 'text-[var(--text-primary)]'
                        }`}>
                          {step.label}
                        </span>
                        {step.links && step.links.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                            {step.links.map((link) => (
                              <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-brand-400 hover:text-brand-300 hover:underline transition-colors"
                              >
                                {link.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Time estimate */}
                      <span className="flex-shrink-0 text-[11px] tabular-nums text-[var(--text-muted)]">
                        {step.timeEstimate}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
