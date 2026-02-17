import { addDays, addWeeks, addMonths, addYears } from 'date-fns'

export type RecurrenceRule = 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export const RECURRENCE_OPTIONS: { value: RecurrenceRule | ''; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export function getNextDueDate(currentDue: string, rule: RecurrenceRule): string {
  const date = new Date(currentDue)

  switch (rule) {
    case 'daily':
      return addDays(date, 1).toISOString().slice(0, 10)
    case 'weekdays': {
      let next = addDays(date, 1)
      while (next.getDay() === 0 || next.getDay() === 6) {
        next = addDays(next, 1)
      }
      return next.toISOString().slice(0, 10)
    }
    case 'weekly':
      return addWeeks(date, 1).toISOString().slice(0, 10)
    case 'biweekly':
      return addWeeks(date, 2).toISOString().slice(0, 10)
    case 'monthly':
      return addMonths(date, 1).toISOString().slice(0, 10)
    case 'yearly':
      return addYears(date, 1).toISOString().slice(0, 10)
  }
}
