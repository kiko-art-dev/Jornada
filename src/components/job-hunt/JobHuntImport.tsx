import { useRef, useState } from 'react'
import { useJobHuntStore } from '../../stores/jobHuntStore'
import { useToastStore } from '../../stores/toastStore'
import type { JobMarket, InterestLevel, ContactMethod, JobStage } from '../../types'

interface Props {
  market: JobMarket
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function mapInterest(val: string): InterestLevel {
  const v = val.toLowerCase().trim()
  if (v.includes('++') || v === 'yes ++' || v === 'high') return 'high'
  if (v === 'maybe' || v === 'low') return 'low'
  return 'medium'
}

function mapContactMethod(val: string): ContactMethod | null {
  const v = val.toLowerCase().trim()
  if (v.includes('linkedin')) return 'linkedin'
  if (v.includes('email')) return 'email'
  if (v.includes('website')) return 'website'
  return null
}

function mapStage(contacted: string, status: string): JobStage {
  const c = contacted.toLowerCase().trim()
  const s = status.toLowerCase().trim()
  if (s.includes('applied')) return 'applied'
  if (s.includes('interview')) return 'interviewing'
  if (s.includes('offer')) return 'offer'
  if (s.includes('closed') || s.includes('rejected')) return 'closed'
  if (c === 'yes' || c.includes('yes')) return 'applied'
  if (c.includes('waiting')) return 'applied'
  return 'studios'
}

export function JobHuntImport({ market }: Props) {
  const createApplication = useJobHuntStore((s) => s.createApplication)
  const addToast = useToastStore((s) => s.addToast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').filter((l) => l.trim())
      if (lines.length < 2) {
        addToast('CSV file is empty or has no data rows', { type: 'warning' })
        return
      }

      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[?"]/g, '').trim())

      const colMap = {
        studio: headers.findIndex((h) => h.includes('studio')),
        games: headers.findIndex((h) => h.includes('game')),
        interested: headers.findIndex((h) => h.includes('interest')),
        contacted: headers.findIndex((h) => h.includes('contact') && !h.includes('how')),
        how: headers.findIndex((h) => h.includes('how') || h.includes('email or linkedin')),
        status: headers.findIndex((h) => h === 'status' || h.includes('status')),
      }

      let imported = 0
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i])
        const studioName = cols[colMap.studio]?.trim()
        if (!studioName) continue

        const games = colMap.games >= 0 ? cols[colMap.games]?.trim() || null : null
        const interested = colMap.interested >= 0 ? cols[colMap.interested]?.trim() || '' : ''
        const contacted = colMap.contacted >= 0 ? cols[colMap.contacted]?.trim() || '' : ''
        const how = colMap.how >= 0 ? cols[colMap.how]?.trim() || '' : ''
        const status = colMap.status >= 0 ? cols[colMap.status]?.trim() || '' : ''

        await createApplication({
          studio_name: studioName,
          notable_games: games,
          interest: mapInterest(interested),
          contact_method: mapContactMethod(how),
          contact_person: null,
          stage: mapStage(contacted, status),
          market,
          notes: status || null,
        })
        imported++
      }

      addToast(`Imported ${imported} studio${imported !== 1 ? 's' : ''}`, { type: 'success' })
    } catch (err) {
      addToast(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`, { type: 'warning' })
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={importing}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-sm font-medium text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)] disabled:opacity-50 transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 10V2m0 0L5 5m3-3 3 3" />
          <path d="M2 10v2.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V10" />
        </svg>
        {importing ? 'Importing...' : 'Import CSV'}
      </button>
    </>
  )
}
