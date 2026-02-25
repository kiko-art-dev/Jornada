import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useJobHuntStore } from '../../stores/jobHuntStore'
import { CONTACT_METHODS } from '../../lib/jobHunt'
import type { JobStage, JobMarket, ContactMethod } from '../../types'

const inputClass = 'w-full rounded-lg bg-[var(--color-surface-input)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] hover:border-[var(--border-default)] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 focus:outline-none transition-all'
const selectClass = 'rounded-lg bg-[var(--color-surface-input)] border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--color-surface-card)] hover:border-[var(--border-default)] hover:shadow-sm focus:bg-[var(--color-surface-card)] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 focus:outline-none transition-all cursor-pointer'

interface Props {
  stage: JobStage
  market: JobMarket
  onClose: () => void
}

export function AddStudioModal({ stage, market: defaultMarket, onClose }: Props) {
  const createApplication = useJobHuntStore((s) => s.createApplication)

  const [studioName, setStudioName] = useState('')
  const [position, setPosition] = useState('')
  const [contactMethod, setContactMethod] = useState<ContactMethod | ''>('')
  const [contactPerson, setContactPerson] = useState('')
  const [market, setMarket] = useState<JobMarket>(defaultMarket)
  const [locations, setLocations] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = async () => {
    const trimmed = studioName.trim()
    if (!trimmed) return
    setSubmitting(true)
    await createApplication({
      studio_name: trimmed,
      stage,
      market,
      position: position.trim() || null,
      contact_method: contactMethod || null,
      contact_person: contactPerson.trim() || null,
      locations: locations.trim() || null,
      job_url: jobUrl.trim() || null,
    })
    setSubmitting(false)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border-default)] bg-[var(--color-surface-card)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Add Studio</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3.5">
          {/* Studio name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-tertiary)]">Studio Name *</label>
            <input
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="e.g. CD Projekt Red"
              className={inputClass}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && studioName.trim()) handleSubmit() }}
            />
          </div>

          {/* Position */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-tertiary)]">Position</label>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Environment Artist"
              className={inputClass}
            />
          </div>

          {/* Contact via + Contact person (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-tertiary)]">Contact Via</label>
              <select
                value={contactMethod}
                onChange={(e) => setContactMethod(e.target.value as ContactMethod | '')}
                className={`${selectClass} w-full`}
              >
                <option value="">None</option>
                {CONTACT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-tertiary)]">Contact Person</label>
              <input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Name"
                className={inputClass}
              />
            </div>
          </div>

          {/* Market */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-tertiary)]">Market</label>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value as JobMarket)}
              className={`${selectClass} w-full`}
            >
              <option value="poland">Poland</option>
              <option value="international">International</option>
            </select>
          </div>

          {/* Location — shows when international */}
          {market === 'international' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-tertiary)]">Location / Country</label>
              <input
                value={locations}
                onChange={(e) => setLocations(e.target.value)}
                placeholder="e.g. London, UK"
                className={inputClass}
              />
            </div>
          )}

          {/* Job URL */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-tertiary)]">Job URL</label>
            <input
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!studioName.trim() || submitting}
            className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Adding...' : 'Add Studio'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
