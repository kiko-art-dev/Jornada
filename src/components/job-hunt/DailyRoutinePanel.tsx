import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useJobHuntStore } from '../../stores/jobHuntStore'
import { DAILY_ROUTINE_STEPS, getAllRoutineKeys } from '../../lib/jobHunt'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dotColor(completed: number, total: number): string {
  if (completed === 0) return '#1a1d2b'
  const pct = completed / total
  if (pct >= 1) return '#22c55e'
  if (pct >= 0.5) return '#3b82f6'
  return '#f59e0b'
}

function Checkbox({ checked, size = 18 }: { checked: boolean; size?: number }) {
  return (
    <motion.div
      animate={checked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      {checked ? (
        <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
          <rect x="1" y="1" width="16" height="16" rx="4" fill="#8b5cf6" />
          <path d="M5.5 9l2.5 2.5 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
          <rect x="1" y="1" width="16" height="16" rx="4" stroke="var(--text-muted)" strokeWidth="1.5" />
        </svg>
      )}
    </motion.div>
  )
}

export function DailyRoutinePanel() {
  const routineLogs = useJobHuntStore((s) => s.routineLogs)
  const routineHistory = useJobHuntStore((s) => s.routineHistory)
  const toggleStep = useJobHuntStore((s) => s.toggleRoutineStep)
  const [open, setOpen] = useState(false)

  const allKeys = getAllRoutineKeys()
  const doneCount = allKeys.filter((k) => routineLogs[k]).length
  const totalCount = allKeys.length

  const timeLeft = DAILY_ROUTINE_STEPS
    .filter((s) => {
      if (s.substeps) {
        return s.substeps.some((sub) => !routineLogs[sub.key])
      }
      return !routineLogs[s.key]
    })
    .reduce((sum, s) => sum + s.timeMinutes, 0)

  // Streak: consecutive days with 100% (not counting today)
  let streak = 0
  for (let i = routineHistory.length - 2; i >= 0; i--) {
    if (routineHistory[i].completed >= routineHistory[i].total) streak++
    else break
  }
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
                        style={{ backgroundColor: dotColor(day.completed, day.total) }}
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
                  // Step with substeps — render as a group
                  if (step.substeps) {
                    const subDone = step.substeps.filter((sub) => routineLogs[sub.key]).length
                    const subTotal = step.substeps.length
                    const allSubDone = subDone === subTotal
                    return (
                      <div key={step.key}>
                        {/* Group header */}
                        <div className="flex items-center gap-3 rounded-lg px-2 py-2.5">
                          <div className="mt-0.5 flex-shrink-0 w-[18px]" />
                          <span className={`text-[13px] font-semibold leading-tight ${
                            allSubDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                          }`}>
                            {step.label}
                          </span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                            allSubDone
                              ? 'bg-green-500/15 text-green-400'
                              : subDone > 0
                                ? 'bg-brand-500/15 text-brand-400'
                                : 'bg-[var(--color-surface-hover)] text-[var(--text-muted)]'
                          }`}>
                            {subDone}/{subTotal}
                          </span>
                          <span className="flex-shrink-0 text-[11px] tabular-nums text-[var(--text-muted)] ml-auto">
                            {step.timeEstimate}
                          </span>
                        </div>

                        {/* Sub-items */}
                        <div className="ml-8 space-y-0">
                          {step.substeps.map((sub) => {
                            const checked = routineLogs[sub.key] || false
                            return (
                              <div
                                key={sub.key}
                                className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--color-surface-hover)]"
                              >
                                <button
                                  onClick={() => toggleStep(sub.key)}
                                  className="flex-shrink-0"
                                >
                                  <Checkbox checked={checked} size={15} />
                                </button>
                                <a
                                  href={sub.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-[12px] transition-all hover:underline ${
                                    checked
                                      ? 'line-through text-[var(--text-muted)]'
                                      : 'text-brand-400 hover:text-brand-300'
                                  }`}
                                >
                                  {sub.label}
                                </a>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }

                  // Regular step (no substeps)
                  const checked = routineLogs[step.key] || false
                  return (
                    <div
                      key={step.key}
                      className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                      <button
                        onClick={() => toggleStep(step.key)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        <Checkbox checked={checked} />
                      </button>
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
