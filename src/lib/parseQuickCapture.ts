import type { Priority, Discipline } from '../types'

const VALID_DISCIPLINES: Discipline[] = ['art', 'code', 'design', 'audio', 'qa', 'writing', 'production']

interface ParsedCapture {
  title: string
  projectName: string | null
  tagNames: string[]
  priority: Priority | null
  dueDate: string | null
  discipline: Discipline | null
}

export function parseQuickCapture(input: string): ParsedCapture {
  let text = input.trim()
  let projectName: string | null = null
  const tagNames: string[] = []
  let priority: Priority | null = null
  let dueDate: string | null = null
  let discipline: Discipline | null = null

  // Extract #project
  const projectMatch = text.match(/#(\S+)/)
  if (projectMatch) {
    projectName = projectMatch[1]
    text = text.replace(projectMatch[0], '').trim()
  }

  // Extract @tags (can have multiple)
  const tagMatches = text.matchAll(/@(\S+)/g)
  for (const match of tagMatches) {
    tagNames.push(match[1])
    text = text.replace(match[0], '').trim()
  }

  // Extract !priority (1-4)
  const priorityMatch = text.match(/!([1-4])/)
  if (priorityMatch) {
    priority = Number(priorityMatch[1]) as Priority
    text = text.replace(priorityMatch[0], '').trim()
  }

  // Extract ~discipline
  const disciplineMatch = text.match(/~(\S+)/)
  if (disciplineMatch) {
    const val = disciplineMatch[1].toLowerCase() as Discipline
    if (VALID_DISCIPLINES.includes(val)) {
      discipline = val
    }
    text = text.replace(disciplineMatch[0], '').trim()
  }

  // Extract due:keyword
  const dueMatch = text.match(/due:(\S+)/)
  if (dueMatch) {
    const keyword = dueMatch[1].toLowerCase()
    const today = new Date()

    switch (keyword) {
      case 'today':
        dueDate = formatDate(today)
        break
      case 'tomorrow':
        today.setDate(today.getDate() + 1)
        dueDate = formatDate(today)
        break
      case 'monday':
      case 'tuesday':
      case 'wednesday':
      case 'thursday':
      case 'friday':
      case 'saturday':
      case 'sunday':
        dueDate = formatDate(getNextDayOfWeek(keyword))
        break
      default:
        // Try parsing as a date string (e.g., 2026-02-15)
        if (/^\d{4}-\d{2}-\d{2}$/.test(keyword)) {
          dueDate = keyword
        }
    }
    text = text.replace(dueMatch[0], '').trim()
  }

  // Clean up extra spaces
  const title = text.replace(/\s+/g, ' ').trim()

  return { title, projectName, tagNames, priority, dueDate, discipline }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getNextDayOfWeek(dayName: string): Date {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const targetDay = days.indexOf(dayName)
  const today = new Date()
  const currentDay = today.getDay()
  let daysUntil = targetDay - currentDay
  if (daysUntil <= 0) daysUntil += 7
  today.setDate(today.getDate() + daysUntil)
  return today
}
