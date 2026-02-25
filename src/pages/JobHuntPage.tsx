import { useEffect, useState } from 'react'
import { useJobHuntStore } from '../stores/jobHuntStore'
import { JobHuntBoard } from '../components/job-hunt/JobHuntBoard'
import { JobHuntStats } from '../components/job-hunt/JobHuntStats'
import { DailyRoutinePanel } from '../components/job-hunt/DailyRoutinePanel'
import { JobHuntDrawer } from '../components/job-hunt/JobHuntDrawer'
import { JobHuntImport } from '../components/job-hunt/JobHuntImport'
import { AddStudioModal } from '../components/job-hunt/AddStudioModal'
import type { JobMarket, JobStage } from '../types'

const MARKET_TABS: { value: JobMarket; label: string }[] = [
  { value: 'poland', label: 'Poland' },
  { value: 'international', label: 'International' },
]

export function JobHuntPage() {
  const fetchApplications = useJobHuntStore((s) => s.fetchApplications)
  const fetchRoutine = useJobHuntStore((s) => s.fetchRoutine)
  const loading = useJobHuntStore((s) => s.loading)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [market, setMarket] = useState<JobMarket>('poland')
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [addingToStage, setAddingToStage] = useState<JobStage | null>(null)

  useEffect(() => {
    fetchApplications()
    fetchRoutine()
  }, [fetchApplications, fetchRoutine])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Job Hunt</h2>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              Game studio application pipeline
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Filter toggle */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setFilterOpen(!filterOpen); if (filterOpen) setSearch('') }}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                  filterOpen || search
                    ? 'border-brand-500/50 bg-brand-500/10 text-brand-400'
                    : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]'
                }`}
                title="Filter studios"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="M10.5 10.5L14 14" />
                </svg>
              </button>
              {filterOpen && (
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter studios..."
                    autoFocus
                    className="w-48 rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-base)] py-1.5 pl-3 pr-7 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M4 4l8 8M12 4l-8 8" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            <JobHuntImport market={market} />
            <div className="flex rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-base)] p-0.5">
            {MARKET_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setMarket(tab.value)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  market === tab.value
                    ? 'bg-brand-500/15 text-brand-400 shadow-sm'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <JobHuntStats market={market} />
          <DailyRoutinePanel />
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <JobHuntBoard
          onSelectApp={setSelectedAppId}
          loading={loading}
          market={market}
          search={search}
          onAddStudio={setAddingToStage}
        />
      </div>

      {/* Add Studio Modal */}
      {addingToStage && (
        <AddStudioModal
          stage={addingToStage}
          market={market}
          onClose={() => setAddingToStage(null)}
        />
      )}

      {/* Drawer */}
      <JobHuntDrawer
        applicationId={selectedAppId}
        onClose={() => setSelectedAppId(null)}
      />
    </div>
  )
}
