import type { Task, Status } from '../types'

interface ChangelogSection {
  heading: string
  items: { title: string; id: string }[]
}

export function generateChangelog(
  tasks: Task[],
  statuses: Status[]
): ChangelogSection[] {
  // Only include done tasks
  const doneTasks = tasks.filter((t) => {
    const status = statuses.find((s) => s.id === t.status_id)
    return status?.category === 'done'
  })

  const added = doneTasks.filter((t) => t.type === 'feature')
  const fixed = doneTasks.filter((t) => t.type === 'bug')
  const changed = doneTasks.filter((t) => t.type === 'task')

  const sections: ChangelogSection[] = []
  if (added.length) sections.push({ heading: 'Added', items: added.map((t) => ({ title: t.title, id: t.id })) })
  if (fixed.length) sections.push({ heading: 'Fixed', items: fixed.map((t) => ({ title: t.title, id: t.id })) })
  if (changed.length) sections.push({ heading: 'Changed', items: changed.map((t) => ({ title: t.title, id: t.id })) })

  return sections
}

export function changelogToMarkdown(
  version: string,
  sections: ChangelogSection[]
): string {
  const lines = [`### Changelog — ${version}`, '']
  for (const section of sections) {
    lines.push(`**${section.heading}**`)
    for (const item of section.items) {
      lines.push(`- ${item.title}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}
