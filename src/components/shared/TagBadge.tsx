interface Props {
  name: string
  color?: string | null
  onRemove?: () => void
}

export function TagBadge({ name, color, onRemove }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: color ? `${color}20` : '#52525220',
        color: color ?? '#a3a3a3',
      }}
    >
      <span>{name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 hover:opacity-70"
        >
          ×
        </button>
      )}
    </span>
  )
}
