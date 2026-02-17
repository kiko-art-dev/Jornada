import type { StatusCategory } from '../../types'

export function StatusIcon({ category, color }: { category?: StatusCategory; color?: string | null }) {
  const c = color ?? '#a3a3a3'

  if (category === 'done') {
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1.5" />
        <path d="M5.5 8l2 2 3.5-4" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (category === 'active') {
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1.5" strokeDasharray="4 3" />
      </svg>
    )
  }

  // backlog / default
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

interface Props {
  name: string
  color?: string | null
  category?: StatusCategory
}

export function StatusBadge({ name, color, category }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
      style={{
        backgroundColor: color ? `${color}18` : '#52525218',
        color: color ?? '#a3a3a3',
      }}
    >
      <StatusIcon category={category} color={color} />
      {name}
    </span>
  )
}
