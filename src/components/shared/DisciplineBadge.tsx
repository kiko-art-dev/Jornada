import { DISCIPLINES, type Discipline } from '../../lib/discipline'

interface Props {
  discipline: Discipline
}

export function DisciplineBadge({ discipline }: Props) {
  const config = DISCIPLINES[discipline]
  if (!config) return null

  return (
    <span
      className="text-xs font-bold uppercase tracking-wide"
      style={{ color: config.color }}
    >
      {config.label}
    </span>
  )
}
