import type { Priority, StatusCategory } from '../types'

export const PRIORITY_COLORS: Record<Priority, { label: string; hex: string }> = {
  1: { label: 'Urgent', hex: '#ef4444' },
  2: { label: 'High', hex: '#f97316' },
  3: { label: 'Medium', hex: '#eab308' },
  4: { label: 'Low', hex: '#6b7280' },
}

export const STATUS_CATEGORY_COLORS: Record<StatusCategory, { hex: string; label: string }> = {
  backlog: { hex: '#6b7280', label: 'Backlog' },
  active:  { hex: '#6366f1', label: 'Active' },
  done:    { hex: '#22c55e', label: 'Done' },
}

export const WORKSPACE_COLORS: Record<string, string> = {
  art: '#c084fc',
  dev: '#60a5fa',
  job: '#f59e0b',
  life: '#34d399',
  general: '#6b7280',
}

export const SECTION_COLORS: Record<string, string> = {
  danger: '#ef4444',
  warning: '#f97316',
  default: '#6366f1',
  muted: '#6b7280',
  success: '#22c55e',
}
