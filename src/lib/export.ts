import { supabase } from './supabase'
import { format } from 'date-fns'
import type { JornadaExport } from '../types'

export type ImportMode = 'merge' | 'replace'

export interface ImportPreview {
  version: string
  totalRecords: number
  backupCounts: Record<string, number>
  existingCounts: Record<string, number>
}

type BackupData = {
  workspaces: JornadaExport['data']['workspaces']
  projects: JornadaExport['data']['projects']
  statuses: JornadaExport['data']['statuses']
  tags: JornadaExport['data']['tags']
  releases: JornadaExport['data']['releases']
  tasks: JornadaExport['data']['tasks']
  task_tags: JornadaExport['data']['task_tags']
  checklist_items: JornadaExport['data']['checklist_items']
  task_notes: JornadaExport['data']['task_notes']
  task_activity: NonNullable<JornadaExport['data']['task_activity']>
  task_dependencies: NonNullable<JornadaExport['data']['task_dependencies']>
  task_attachments: NonNullable<JornadaExport['data']['task_attachments']>
}

type NormalizedBackup = {
  version: JornadaExport['version']
  exported_at: string
  data: BackupData
}

interface TableConfig {
  key: keyof BackupData
  table: string
  countColumn: string
  deleteColumn: string
  onConflict: string
}

const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

const TABLES: TableConfig[] = [
  { key: 'workspaces', table: 'workspaces', countColumn: 'id', deleteColumn: 'id', onConflict: 'id' },
  { key: 'projects', table: 'projects', countColumn: 'id', deleteColumn: 'id', onConflict: 'id' },
  { key: 'statuses', table: 'statuses', countColumn: 'id', deleteColumn: 'id', onConflict: 'id' },
  { key: 'tags', table: 'tags', countColumn: 'id', deleteColumn: 'id', onConflict: 'id' },
  { key: 'releases', table: 'releases', countColumn: 'id', deleteColumn: 'id', onConflict: 'id' },
  { key: 'tasks', table: 'tasks', countColumn: 'id', deleteColumn: 'id', onConflict: 'id' },
  { key: 'task_tags', table: 'task_tags', countColumn: 'task_id', deleteColumn: 'task_id', onConflict: 'task_id,tag_id' },
  { key: 'checklist_items', table: 'checklist_items', countColumn: 'id', deleteColumn: 'id', onConflict: 'id' },
  { key: 'task_notes', table: 'task_notes', countColumn: 'id', deleteColumn: 'id', onConflict: 'id' },
  { key: 'task_activity', table: 'task_activity', countColumn: 'id', deleteColumn: 'id', onConflict: 'id' },
  { key: 'task_dependencies', table: 'task_dependencies', countColumn: 'id', deleteColumn: 'id', onConflict: 'id' },
  { key: 'task_attachments', table: 'task_attachments', countColumn: 'id', deleteColumn: 'id', onConflict: 'id' },
]

const INSERT_ORDER: TableConfig[] = [
  TABLES[0],
  TABLES[1],
  TABLES[2],
  TABLES[3],
  TABLES[4],
  TABLES[5],
  TABLES[6],
  TABLES[7],
  TABLES[8],
  TABLES[9],
  TABLES[10],
  TABLES[11],
]

const DELETE_ORDER: TableConfig[] = [
  TABLES[9],
  TABLES[10],
  TABLES[11],
  TABLES[8],
  TABLES[7],
  TABLES[6],
  TABLES[5],
  TABLES[4],
  TABLES[2],
  TABLES[3],
  TABLES[1],
  TABLES[0],
]

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function normalizeBackup(backup: JornadaExport): NormalizedBackup {
  const data = (backup.data ?? {}) as Partial<BackupData>
  return {
    version: backup.version,
    exported_at: backup.exported_at,
    data: {
      workspaces: data.workspaces ?? [],
      projects: data.projects ?? [],
      statuses: data.statuses ?? [],
      tags: data.tags ?? [],
      releases: data.releases ?? [],
      tasks: data.tasks ?? [],
      task_tags: data.task_tags ?? [],
      checklist_items: data.checklist_items ?? [],
      task_notes: data.task_notes ?? [],
      task_activity: data.task_activity ?? [],
      task_dependencies: data.task_dependencies ?? [],
      task_attachments: data.task_attachments ?? [],
    },
  }
}

function parseBackup(text: string): NormalizedBackup | string {
  let parsed: JornadaExport
  try {
    parsed = JSON.parse(text) as JornadaExport
  } catch {
    return 'Invalid JSON file.'
  }

  if (parsed.version !== '1.0' && parsed.version !== '1.1') {
    return `Unsupported backup version: ${parsed.version}`
  }

  return normalizeBackup(parsed)
}

function toCSVCell(value: unknown): string {
  const text = String(value ?? '')
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

async function tableCount(table: string, countColumn: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select(countColumn, { count: 'exact', head: true })

  if (error) throw new Error(`${table}: ${error.message}`)
  return count ?? 0
}

export async function exportJSON(): Promise<void> {
  const [workspaces, projects, statuses, tags, releases, tasks, task_tags, checklist_items, task_notes, task_activity, task_dependencies, task_attachments] =
    await Promise.all([
      supabase.from('workspaces').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('statuses').select('*'),
      supabase.from('tags').select('*'),
      supabase.from('releases').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('task_tags').select('*'),
      supabase.from('checklist_items').select('*'),
      supabase.from('task_notes').select('*'),
      supabase.from('task_activity').select('*'),
      supabase.from('task_dependencies').select('*'),
      supabase.from('task_attachments').select('*'),
    ])

  const exportData: JornadaExport = {
    version: '1.1',
    exported_at: new Date().toISOString(),
    data: {
      workspaces: workspaces.data ?? [],
      projects: projects.data ?? [],
      statuses: statuses.data ?? [],
      tags: tags.data ?? [],
      releases: releases.data ?? [],
      tasks: tasks.data ?? [],
      task_tags: task_tags.data ?? [],
      checklist_items: checklist_items.data ?? [],
      task_notes: task_notes.data ?? [],
      task_activity: task_activity.data ?? [],
      task_dependencies: task_dependencies.data ?? [],
      task_attachments: task_attachments.data ?? [],
    },
  }

  downloadFile(
    JSON.stringify(exportData, null, 2),
    `jornada-backup-${format(new Date(), 'yyyy-MM-dd')}.json`,
    'application/json'
  )
}

export async function exportCSV(): Promise<void> {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, projects(name), statuses(name), releases(version)')
    .eq('archived', false)

  if (!tasks) return

  const csv = [
    'ID,Title,Project,Status,Priority,Type,Due Date,Release,Created',
    ...tasks.map((t: Record<string, unknown>) => [
      t.id,
      toCSVCell(t.title),
      toCSVCell((t.projects as Record<string, unknown>)?.name ?? 'Inbox'),
      toCSVCell((t.statuses as Record<string, unknown>)?.name ?? ''),
      t.priority,
      t.type,
      t.due_date ?? '',
      toCSVCell((t.releases as Record<string, unknown>)?.version ?? ''),
      t.created_at,
    ].join(',')),
  ].join('\n')

  downloadFile(
    csv,
    `jornada-tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    'text/csv'
  )
}

export async function previewImportJSON(file: File): Promise<ImportPreview | string> {
  const text = await file.text()
  const parsed = parseBackup(text)
  if (typeof parsed === 'string') return parsed

  const backupCounts: Record<string, number> = {}
  for (const table of TABLES) {
    backupCounts[table.key] = parsed.data[table.key].length
  }

  let existingEntries: ReadonlyArray<readonly [string, number]>
  try {
    existingEntries = await Promise.all(
      TABLES.map(async (table) => {
        const count = await tableCount(table.table, table.countColumn)
        return [table.key, count] as const
      })
    )
  } catch (error) {
    return error instanceof Error ? error.message : 'Failed to generate import preview.'
  }

  const existingCounts = Object.fromEntries(existingEntries)
  const totalRecords = Object.values(backupCounts).reduce((sum, value) => sum + value, 0)

  return {
    version: parsed.version,
    totalRecords,
    backupCounts,
    existingCounts,
  }
}

export async function importJSON(file: File, options: { mode?: ImportMode } = {}): Promise<string> {
  const mode = options.mode ?? 'merge'
  const text = await file.text()
  const parsed = parseBackup(text)
  if (typeof parsed === 'string') return parsed

  if (mode === 'replace') {
    for (const table of DELETE_ORDER) {
      const { error } = await supabase
        .from(table.table)
        .delete()
        .neq(table.deleteColumn, ZERO_UUID)

      if (error) return `Failed while clearing ${table.table}: ${error.message}`
    }

    for (const table of INSERT_ORDER) {
      const rows = parsed.data[table.key]
      if (rows.length === 0) continue

      const { error } = await supabase
        .from(table.table)
        .insert(rows as never[])

      if (error) return `Failed while restoring ${table.table}: ${error.message}`
    }

    return 'ok'
  }

  for (const table of INSERT_ORDER) {
    const rows = parsed.data[table.key]
    if (rows.length === 0) continue

    const { error } = await supabase
      .from(table.table)
      .upsert(rows as never[], { onConflict: table.onConflict })

    if (error) return `Failed while merging ${table.table}: ${error.message}`
  }

  return 'ok'
}
