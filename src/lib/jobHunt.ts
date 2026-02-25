import type { JobStage, InterestLevel } from '../types'

export const JOB_STAGES: { value: JobStage; label: string; color: string }[] = [
  { value: 'studios',      label: 'Studios',      color: '#6b7280' },
  { value: 'applied',      label: 'Applied',      color: '#3b82f6' },
  { value: 'interviewing', label: 'Interviewing', color: '#f97316' },
  { value: 'offer',        label: 'Offer',        color: '#22c55e' },
  { value: 'closed',       label: 'Closed',       color: '#ef4444' },
]

export const JOB_STAGE_MAP = Object.fromEntries(
  JOB_STAGES.map((s) => [s.value, s])
) as Record<JobStage, (typeof JOB_STAGES)[number]>

export const INTEREST_CONFIG: Record<InterestLevel, { label: string; color: string; symbol: string }> = {
  high:   { label: 'High',   color: '#22c55e', symbol: '\u2605' },
  medium: { label: 'Medium', color: '#eab308', symbol: '\u25C9' },
  low:    { label: 'Low',    color: '#6b7280', symbol: '\u25CB' },
}

export const CONTACT_METHODS = [
  { value: 'linkedin' as const, label: 'LinkedIn' },
  { value: 'email' as const,    label: 'Email' },
  { value: 'website' as const,  label: 'Website' },
]
