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

// --- Daily Routine ---

export interface RoutineSubstep {
  key: string
  label: string
  url: string
}

export interface RoutineStep {
  key: string
  label: string
  timeEstimate: string
  timeMinutes: number
  links?: { label: string; url: string }[]
  substeps?: RoutineSubstep[]
}

export const DAILY_ROUTINE_STEPS: RoutineStep[] = [
  {
    key: 'check_warsaw',
    label: 'Check Warsaw studio career pages',
    timeEstimate: '5 min',
    timeMinutes: 5,
    links: [
      { label: 'CD Projekt RED', url: 'https://www.cdprojektred.com/en/jobs' },
      { label: 'Techland', url: 'https://techland.net/company/careers' },
      { label: 'People Can Fly', url: 'https://peoplecanfly.com/careers/' },
      { label: 'Larian Warsaw', url: 'https://larian.com/careers/location/warsaw' },
      { label: '11 bit', url: 'https://www.11bitstudios.com/careers/' },
      { label: 'Flying Wild Hog', url: 'https://flyingwildhog.com/careers/' },
    ],
  },
  {
    key: 'scan_boards',
    label: 'Scan job boards',
    timeEstimate: '10 min',
    timeMinutes: 10,
    substeps: [
      { key: 'board_artstation',        label: 'ArtStation Jobs',    url: 'https://www.artstation.com/jobs' },
      { key: 'board_hitmarker',         label: 'Hitmarker',          url: 'https://hitmarker.net/' },
      { key: 'board_ingamejob',         label: 'InGame Job',         url: 'https://ingamejob.com/en' },
      { key: 'board_gamejobs_eu',       label: 'GameJobs.eu',        url: 'https://gamejobs.eu/' },
      { key: 'board_gamesjobsdirect',   label: 'Games Jobs Direct',  url: 'https://www.gamesjobsdirect.com/' },
      { key: 'board_gamescareer',       label: 'Games-Career',       url: 'https://www.games-career.com/' },
      { key: 'board_workwithindies',    label: 'Work With Indies',   url: 'https://www.workwithindies.com/' },
      { key: 'board_remoterocketship',  label: 'Remote Rocketship',  url: 'https://www.remoterocketship.com/country/europe/jobs/art-director/' },
      { key: 'board_skillshot',         label: 'Skillshot',          url: 'https://www.skillshot.pl/' },
      { key: 'board_gamejobs_co',       label: 'GameJobs.co',        url: 'https://gamejobs.co/' },
      { key: 'board_remotegamejobs',    label: 'Remote Game Jobs',   url: 'https://remotegamejobs.com/' },
      { key: 'board_linkedin',          label: 'LinkedIn Jobs',      url: 'https://www.linkedin.com/jobs/' },
    ],
  },
  {
    key: 'send_application',
    label: 'Send 1 application or follow-up',
    timeEstimate: '15 min',
    timeMinutes: 15,
  },
  {
    key: 'social_engage',
    label: 'Post or engage with 3 industry posts',
    timeEstimate: '10 min',
    timeMinutes: 10,
  },
  {
    key: 'portfolio_work',
    label: 'Work on portfolio / MAKINA',
    timeEstimate: 'rest',
    timeMinutes: 0,
  },
]

/** All checkable keys (top-level steps without substeps + all substep keys) */
export function getAllRoutineKeys(): string[] {
  const keys: string[] = []
  for (const step of DAILY_ROUTINE_STEPS) {
    if (step.substeps) {
      for (const sub of step.substeps) keys.push(sub.key)
    } else {
      keys.push(step.key)
    }
  }
  return keys
}
