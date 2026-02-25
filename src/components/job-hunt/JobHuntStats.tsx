import { useMemo, useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { isPast, isToday } from 'date-fns'
import { useJobHuntStore } from '../../stores/jobHuntStore'
import type { JobMarket } from '../../types'

interface Props {
  market: JobMarket
}

const FUNNEL_STAGES = [
  { key: 'studios',      label: 'Studios',      color: '#6b7280' },
  { key: 'applied',      label: 'Applied',      color: '#3b82f6' },
  { key: 'interviewing', label: 'Interviewing', color: '#f97316' },
  { key: 'offer',        label: 'Offer',        color: '#22c55e' },
] as const

function useAnimatedNumber(target: number, duration = 400) {
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)

  useEffect(() => {
    const from = prevRef.current
    prevRef.current = target
    if (from === target) return

    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return display
}

export function JobHuntStats({ market }: Props) {
  const allApplications = useJobHuntStore((s) => s.applications)
  const applications = allApplications.filter((a) => a.market === market)
  const [funnelOpen, setFunnelOpen] = useState(false)

  const stats = useMemo(() => {
    const total = applications.length
    const applied = applications.filter((a) =>
      ['applied', 'interviewing', 'offer', 'closed'].includes(a.stage)
    ).length
    const interviewing = applications.filter((a) => a.stage === 'interviewing').length
    const responded = applications.filter((a) =>
      ['interviewing', 'offer', 'closed'].includes(a.stage)
    ).length
    const responseRate = applied > 0 ? Math.round((responded / applied) * 100) : 0
    const overdue = applications.filter((a) =>
      a.next_action_date &&
      isPast(new Date(a.next_action_date)) &&
      !isToday(new Date(a.next_action_date))
    ).length

    return { total, applied, interviewing, responseRate, overdue }
  }, [applications])

  const funnelData = useMemo(() => {
    const counts = FUNNEL_STAGES.map((stage) => ({
      ...stage,
      count: applications.filter((a) => a.stage === stage.key).length,
    }))
    const max = Math.max(...counts.map((c) => c.count), 1)
    return counts.map((c) => ({ ...c, pct: Math.round((c.count / max) * 100) }))
  }, [applications])

  const animTotal = useAnimatedNumber(stats.total)
  const animApplied = useAnimatedNumber(stats.applied)
  const animInterviewing = useAnimatedNumber(stats.interviewing)
  const animResponseRate = useAnimatedNumber(stats.responseRate)
  const animOverdue = useAnimatedNumber(stats.overdue)

  const cards = [
    { label: 'Total Active',       value: animTotal,                  color: 'text-brand-400' },
    { label: 'Applied+',           value: animApplied,                color: 'text-blue-400' },
    { label: 'Interviewing',       value: animInterviewing,           color: 'text-orange-400' },
    { label: 'Response Rate',      value: `${animResponseRate}%`,     color: 'text-green-400' },
    { label: 'Overdue Follow-ups', value: animOverdue,                color: stats.overdue > 0 ? 'text-red-400' : 'text-[var(--text-muted)]' },
  ]

  return (
    <div className="space-y-3">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-card)] p-4 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              {card.label}
            </p>
            <p className={`mt-1 text-xl font-bold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Funnel toggle */}
      {applications.length > 0 && (
        <>
          <button
            onClick={() => setFunnelOpen(!funnelOpen)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <motion.svg
              animate={{ rotate: funnelOpen ? 90 : 0 }}
              transition={{ duration: 0.15 }}
              width="12" height="12" viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M6 3l5 5-5 5z" />
            </motion.svg>
            Pipeline Funnel
          </button>

          <AnimatePresence initial={false}>
            {funnelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-card)] p-4 shadow-sm">
                  <div className="space-y-2">
                    {funnelData.map((stage, i) => (
                      <div key={stage.key} className="flex items-center gap-3">
                        <span className="w-20 text-[11px] font-medium text-[var(--text-tertiary)]">{stage.label}</span>
                        <div className="flex-1 h-5 rounded bg-[var(--color-surface-hover)] overflow-hidden">
                          <motion.div
                            className="h-full rounded"
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.pct}%` }}
                            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: i * 0.08 }}
                            style={{
                              backgroundColor: stage.color,
                              minWidth: stage.count > 0 ? '8px' : '0',
                            }}
                          />
                        </div>
                        <span className="w-6 text-right text-[11px] font-medium tabular-nums text-[var(--text-tertiary)]">
                          {stage.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
