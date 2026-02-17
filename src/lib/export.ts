import { supabase } from './supabase'
import { format } from 'date-fns'
import type { JornadaExport } from '../types'

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportJSON(): Promise<void> {
  const [workspaces, projects, statuses, tags, releases, tasks, task_tags, checklist_items, task_notes] =
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
    ])

  const exportData: JornadaExport = {
    version: '1.0',
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

  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`

  const csv = [
    'ID,Title,Project,Status,Priority,Type,Due Date,Release,Created',
    ...tasks.map((t: Record<string, unknown>) => [
      t.id,
      escape(String(t.title ?? '')),
      escape(String((t.projects as Record<string, unknown>)?.name ?? 'Inbox')),
      escape(String((t.statuses as Record<string, unknown>)?.name ?? '')),
      t.priority,
      t.type,
      t.due_date ?? '',
      (t.releases as Record<string, unknown>)?.version ?? '',
      t.created_at,
    ].join(',')),
  ].join('\n')

  downloadFile(
    csv,
    `jornada-tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    'text/csv'
  )
}

export async function importJSON(file: File): Promise<string> {
  const text = await file.text()
  let backup: JornadaExport

  try {
    backup = JSON.parse(text)
  } catch {
    return 'Invalid JSON file.'
  }

  if (backup.version !== '1.0') {
    return `Unsupported backup version: ${backup.version}`
  }

  // Delete in dependency order
  await supabase.from('task_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('checklist_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('task_tags').delete().neq('task_id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('releases').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('statuses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('tags').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('workspaces').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Insert in dependency order
  if (backup.data.workspaces.length) await supabase.from('workspaces').insert(backup.data.workspaces)
  if (backup.data.projects.length) await supabase.from('projects').insert(backup.data.projects)
  if (backup.data.statuses.length) await supabase.from('statuses').insert(backup.data.statuses)
  if (backup.data.tags.length) await supabase.from('tags').insert(backup.data.tags)
  if (backup.data.releases.length) await supabase.from('releases').insert(backup.data.releases)
  if (backup.data.tasks.length) await supabase.from('tasks').insert(backup.data.tasks)
  if (backup.data.task_tags.length) await supabase.from('task_tags').insert(backup.data.task_tags)
  if (backup.data.checklist_items.length) await supabase.from('checklist_items').insert(backup.data.checklist_items)
  if (backup.data.task_notes.length) await supabase.from('task_notes').insert(backup.data.task_notes)

  return 'ok'
}
