import { useSortable } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { format, isPast, isToday } from 'date-fns'
import { useJobHuntStore } from '../../stores/jobHuntStore'
import type { JobApplication } from '../../types'
import { INTEREST_CONFIG } from '../../lib/jobHunt'

interface Props {
  application: JobApplication
  isDragOverlay?: boolean
  onSelect?: (id: string) => void
}

export function JobHuntCard({ application, isDragOverlay, onSelect }: Props) {
  const interest = INTEREST_CONFIG[application.interest]
  const togglePin = useJobHuntStore((s) => s.togglePin)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: application.id,
    data: { type: 'application', application },
    disabled: isDragOverlay,
  })

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0.4 : 1,
  }

  const isOverdue =
    application.next_action_date &&
    isPast(new Date(application.next_action_date)) &&
    !isToday(new Date(application.next_action_date))
  const isDueToday =
    application.next_action_date && isToday(new Date(application.next_action_date))

  if (isDragOverlay) {
    return (
      <motion.div
        initial={{ scale: 1, rotate: 0 }}
        animate={{ scale: 1.04, rotate: 1 }}
        className="w-[268px] cursor-grabbing rounded-xl border border-brand-500/40 bg-[var(--color-surface-card)] p-4 shadow-xl shadow-black/25"
      >
        <div className="flex items-center gap-2">
          <span style={{ color: interest.color }} className="text-sm">{interest.symbol}</span>
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{application.studio_name}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect?.(application.id)}
      className={`group/card relative cursor-pointer rounded-xl border bg-[var(--color-surface-card)] shadow-sm hover:border-[var(--border-default)] hover:-translate-y-px hover:shadow-md transition-all ${
        application.pinned
          ? 'border-t-2 border-t-brand-400/60 border-x-[var(--border-subtle)] border-b-[var(--border-subtle)]'
          : isOverdue
            ? 'border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
            : isDueToday
              ? 'border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.15)]'
              : 'border-[var(--border-subtle)]'
      }`}
    >
      <div className="p-4">
        {/* Studio name + interest */}
        <div className="flex items-start gap-2">
          <span style={{ color: interest.color }} className="mt-0.5 flex-shrink-0 text-sm leading-none">
            {interest.symbol}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
              {application.studio_name}
            </p>
            {application.position && (
              <p className="mt-0.5 text-xs text-[var(--text-tertiary)] line-clamp-1">
                {application.position}
              </p>
            )}
          </div>
        </div>

        {/* Meta section */}
        {(application.locations || application.notable_games || application.next_action_date || application.contact_method) && (
          <div className="mt-3 border-t border-[var(--border-subtle)] pt-3 space-y-1.5">
            {application.locations && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 1.5a4.5 4.5 0 0 1 4.5 4.5c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 0 1 8 1.5z" />
                  <circle cx="8" cy="6" r="1.5" />
                </svg>
                <span className="line-clamp-1">{application.locations}</span>
              </div>
            )}
            {application.notable_games && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 10.5a2.5 2.5 0 0 0 5 0V5.5a2.5 2.5 0 1 1 5 0v5" />
                  <circle cx="4.5" cy="10.5" r="1.5" />
                  <circle cx="11.5" cy="10.5" r="1.5" />
                </svg>
                <span className="line-clamp-1">{application.notable_games}</span>
              </div>
            )}
            {application.next_action_date && (
              <div className={`flex items-center gap-1.5 text-xs ${
                isOverdue ? 'text-red-400' : isDueToday ? 'text-orange-400' : 'text-[var(--text-tertiary)]'
              }`}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2.5" width="12" height="11" rx="2" />
                  <path d="M5 1v3M11 1v3M2 6h12" />
                </svg>
                {format(new Date(application.next_action_date), 'MMM d')}
                {isOverdue && <span className="text-[10px] font-medium uppercase">overdue</span>}
              </div>
            )}
            {application.contact_method && (
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                  application.contact_method === 'linkedin'
                    ? 'bg-blue-500/10 text-blue-400'
                    : application.contact_method === 'email'
                      ? 'bg-purple-500/10 text-purple-400'
                      : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {application.contact_method === 'linkedin' ? 'LinkedIn'
                    : application.contact_method === 'email' ? 'Email'
                      : 'Website'}
                </span>
                {application.contact_person && (
                  <span className="text-[10px] text-[var(--text-muted)] line-clamp-1">
                    {application.contact_person}
                  </span>
                )}
              </div>
            )}
            {application.job_url && (
              <a
                href={application.job_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-400 hover:bg-brand-500/20 transition-colors w-fit"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6" />
                  <path d="M10 14 21 3" />
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                </svg>
                {(() => { try { return new URL(application.job_url).hostname.replace('www.', '') } catch { return 'Link' } })()}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Pin button */}
      <button
        onClick={(e) => { e.stopPropagation(); togglePin(application.id) }}
        className={`absolute top-3 right-10 rounded-md p-1 transition-colors ${
          application.pinned
            ? 'block text-brand-400'
            : 'hidden text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)] group-hover/card:block'
        }`}
        title={application.pinned ? 'Unpin' : 'Pin to top'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={application.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 17v5" />
          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 1 1-1h.5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5H8a1 1 0 0 1 1 1z" />
        </svg>
      </button>

      {/* Open detail icon on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect?.(application.id) }}
        className="absolute top-3 right-3 hidden rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)] group-hover/card:block transition-colors"
        title="Open details"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      </button>
    </div>
  )
}
