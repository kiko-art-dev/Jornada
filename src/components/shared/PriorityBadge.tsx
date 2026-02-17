import type { Priority } from '../../types'
import { PRIORITY_COLORS } from '../../lib/theme'

function FlagIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 2v12M3 2h8l-2 3 2 3H3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={`${color}30`}
      />
    </svg>
  )
}

interface Props {
  priority: Priority
  size?: 'sm' | 'md'
}

export function PriorityBadge({ priority, size = 'sm' }: Props) {
  const config = PRIORITY_COLORS[priority]

  return (
    <span className="inline-flex items-center gap-1">
      <FlagIcon color={config.hex} />
      {size === 'md' && (
        <span className="text-[11px] font-medium" style={{ color: config.hex }}>
          {config.label}
        </span>
      )}
    </span>
  )
}
