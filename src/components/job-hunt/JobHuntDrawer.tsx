import { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { useJobHuntStore } from '../../stores/jobHuntStore'
import { JOB_STAGES, JOB_STAGE_MAP, INTEREST_CONFIG, CONTACT_METHODS } from '../../lib/jobHunt'
import type { JobStage, InterestLevel, ContactMethod, JobMarket } from '../../types'

const selectClass = 'rounded-lg bg-[var(--color-surface-input)] border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--color-surface-card)] hover:border-[var(--border-default)] hover:shadow-sm focus:bg-[var(--color-surface-card)] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 focus:outline-none transition-all cursor-pointer'
const inputClass = 'w-full rounded-lg bg-[var(--color-surface-input)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] hover:border-[var(--border-default)] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 focus:outline-none transition-all'
const sectionHeading = 'text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]'

interface Props {
  applicationId: string | null
  onClose: () => void
}

export function JobHuntDrawer({ applicationId, onClose }: Props) {
  const applications = useJobHuntStore((s) => s.applications)
  const updateApplication = useJobHuntStore((s) => s.updateApplication)
  const moveToStage = useJobHuntStore((s) => s.moveToStage)
  const archiveApplication = useJobHuntStore((s) => s.archiveApplication)
  const fetchTimeline = useJobHuntStore((s) => s.fetchTimeline)
  const getAppTimeline = useJobHuntStore((s) => s.getAppTimeline)

  const app = applications.find((a) => a.id === applicationId)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [notesValue, setNotesValue] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (applicationId) {
      fetchTimeline(applicationId)
    }
  }, [applicationId, fetchTimeline])

  useEffect(() => {
    if (app) {
      setTitleValue(app.studio_name)
      setNotesValue(app.notes ?? '')
      setEditingTitle(false)
      setEditingNotes(false)
    }
  }, [app])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && applicationId) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [applicationId, onClose])

  const timeline = app ? getAppTimeline(app.id) : []

  const handleTitleSave = () => {
    if (!app) return
    setEditingTitle(false)
    if (titleValue.trim() && titleValue !== app.studio_name) {
      updateApplication(app.id, { studio_name: titleValue.trim() })
    }
  }

  const handleNotesSave = () => {
    if (!app) return
    setEditingNotes(false)
    if (notesValue !== (app.notes ?? '')) {
      updateApplication(app.id, { notes: notesValue || null })
    }
  }

  const handleStageChange = (newStage: JobStage) => {
    if (!app || app.stage === newStage) return
    moveToStage(app.id, newStage)
  }

  const currentStage = app ? JOB_STAGE_MAP[app.stage] : null

  return (
    <AnimatePresence>
      {applicationId && app && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-xl flex-col border-l border-[var(--border-default)] bg-[var(--color-surface-card)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
              <div className="flex items-center gap-2 text-xs">
                {currentStage && (
                  <span
                    className="rounded px-2 py-0.5 font-medium"
                    style={{
                      backgroundColor: `${currentStage.color}20`,
                      color: currentStage.color,
                    }}
                  >
                    {currentStage.label}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Studio name */}
              {editingTitle ? (
                <input
                  ref={titleRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                  className="mb-4 w-full bg-transparent text-xl font-bold text-[var(--text-primary)] focus:outline-none"
                  autoFocus
                />
              ) : (
                <h2
                  onClick={() => setEditingTitle(true)}
                  className="mb-4 cursor-text text-xl font-bold text-[var(--text-primary)] hover:text-[var(--text-primary)]"
                >
                  {app.studio_name}
                </h2>
              )}

              {/* Metadata grid */}
              <div className="mb-6 grid grid-cols-[110px_1fr] gap-y-3.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">Position</span>
                <input
                  type="text"
                  value={app.position ?? ''}
                  onChange={(e) => updateApplication(app.id, { position: e.target.value || null })}
                  placeholder="e.g. Environment Artist"
                  className={inputClass}
                />

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Stage</span>
                <select
                  value={app.stage}
                  onChange={(e) => handleStageChange(e.target.value as JobStage)}
                  className={selectClass}
                >
                  {JOB_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Interest</span>
                <select
                  value={app.interest}
                  onChange={(e) => updateApplication(app.id, { interest: e.target.value as InterestLevel })}
                  className={selectClass}
                >
                  {Object.entries(INTEREST_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>{config.symbol} {config.label}</option>
                  ))}
                </select>

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Locations</span>
                <input
                  type="text"
                  value={app.locations ?? ''}
                  onChange={(e) => updateApplication(app.id, { locations: e.target.value || null })}
                  placeholder="e.g. Warsaw, Krakow"
                  className={inputClass}
                />

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Market</span>
                <select
                  value={app.market}
                  onChange={(e) => updateApplication(app.id, { market: e.target.value as JobMarket })}
                  className={selectClass}
                >
                  <option value="poland">Poland</option>
                  <option value="international">International</option>
                </select>

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Games</span>
                <input
                  type="text"
                  value={app.notable_games ?? ''}
                  onChange={(e) => updateApplication(app.id, { notable_games: e.target.value || null })}
                  placeholder="e.g. Cyberpunk, Witcher"
                  className={inputClass}
                />

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Contact via</span>
                <select
                  value={app.contact_method ?? ''}
                  onChange={(e) => updateApplication(app.id, { contact_method: (e.target.value || null) as ContactMethod | null })}
                  className={selectClass}
                >
                  <option value="">None</option>
                  {CONTACT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Contact person</span>
                <input
                  type="text"
                  value={app.contact_person ?? ''}
                  onChange={(e) => updateApplication(app.id, { contact_person: e.target.value || null })}
                  placeholder="Name"
                  className={inputClass}
                />

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Follow-up</span>
                <input
                  type="date"
                  value={app.next_action_date ?? ''}
                  onChange={(e) => updateApplication(app.id, { next_action_date: e.target.value || null })}
                  className={selectClass}
                />

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Job URL</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={app.job_url ?? ''}
                    onChange={(e) => updateApplication(app.id, { job_url: e.target.value || null })}
                    placeholder="https://..."
                    className={`${inputClass} flex-1`}
                  />
                  {app.job_url && (
                    <a
                      href={app.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-brand-400"
                      title="Open link"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6" />
                        <path d="M10 14 21 3" />
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <h3 className={sectionHeading + ' mb-2'}>Notes</h3>
                {editingNotes ? (
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    onBlur={handleNotesSave}
                    className="w-full rounded-lg bg-[var(--color-surface-input)] border border-brand-500 px-3 py-2 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none"
                    rows={4}
                    autoFocus
                    placeholder="Add notes about this studio..."
                  />
                ) : (
                  <div
                    onClick={() => setEditingNotes(true)}
                    className="min-h-[60px] cursor-text rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-input)] px-3 py-2 text-sm text-[var(--text-tertiary)] hover:border-[var(--border-default)]"
                  >
                    {app.notes || (
                      <span className="text-[var(--text-muted)]">Click to add notes...</span>
                    )}
                  </div>
                )}
              </div>

              {/* Timeline */}
              {timeline.length > 0 && (
                <div className="mb-6">
                  <h3 className={sectionHeading + ' mb-3'}>Timeline</h3>
                  <div className="space-y-0">
                    {timeline.map((entry, i) => {
                      const toStage = JOB_STAGE_MAP[entry.to_stage as JobStage]
                      const fromStage = entry.from_stage ? JOB_STAGE_MAP[entry.from_stage as JobStage] : null
                      return (
                        <div key={entry.id} className="flex items-start gap-3 py-2">
                          {/* Vertical line + dot */}
                          <div className="flex flex-col items-center">
                            <div
                              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: toStage?.color ?? '#6b7280' }}
                            />
                            {i < timeline.length - 1 && (
                              <div className="w-px flex-1 bg-[var(--border-subtle)]" style={{ minHeight: 20 }} />
                            )}
                          </div>
                          <div className="-mt-0.5">
                            <p className="text-xs text-[var(--text-secondary)]">
                              {fromStage
                                ? <>Moved from <span style={{ color: fromStage.color }}>{fromStage.label}</span> to <span style={{ color: toStage?.color }}>{toStage?.label}</span></>
                                : <>Added to <span style={{ color: toStage?.color }}>{toStage?.label}</span></>
                              }
                            </p>
                            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-6 py-3">
              <button
                onClick={() => useJobHuntStore.getState().togglePin(app.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  app.pinned ? 'text-brand-400 hover:bg-brand-500/10' : 'text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {app.pinned ? 'Unpin' : 'Pin'}
              </button>
              <div className="w-px h-4 bg-[var(--border-subtle)]" />
              <button
                onClick={() => { archiveApplication(app.id); onClose() }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
              >
                Archive
              </button>
              <button
                onClick={() => { if (confirm(`Delete "${app.studio_name}" permanently?`)) { useJobHuntStore.getState().deleteApplication(app.id); onClose() } }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-red-400"
              >
                Delete
              </button>
              {currentStage && (
                <span
                  className="ml-auto rounded px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: `${currentStage.color}15`, color: currentStage.color }}
                >
                  {currentStage.label}
                </span>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
