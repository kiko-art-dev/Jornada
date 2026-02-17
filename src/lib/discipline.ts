export type Discipline = 'art' | 'code' | 'design' | 'audio' | 'qa' | 'writing' | 'production'

export interface DisciplineConfig {
  label: string
  color: string
}

export const DISCIPLINES: Record<Discipline, DisciplineConfig> = {
  art:        { label: 'Art',        color: '#c084fc' },
  code:       { label: 'Code',       color: '#60a5fa' },
  design:     { label: 'Design',     color: '#f472b6' },
  audio:      { label: 'Audio',      color: '#facc15' },
  qa:         { label: 'QA',         color: '#fb923c' },
  writing:    { label: 'Writing',    color: '#34d399' },
  production: { label: 'Production', color: '#a78bfa' },
}

export const DISCIPLINE_LIST = Object.entries(DISCIPLINES) as [Discipline, DisciplineConfig][]
