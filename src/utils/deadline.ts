import { differenceInDays, parseISO, startOfDay, format } from 'date-fns'

export interface DeadlineInfo {
  /** Formatted date string, e.g. "14 mar 2026" */
  dateLabel: string
  /**
   * Days until deadline from today.
   * Negative = overdue. 0 = today. Positive = future.
   */
  days: number
  isOverdue: boolean
}

/** Returns structured deadline info for rendering relative labels. */
export function getDeadlineInfo(deadline: string): DeadlineInfo {
  const date = parseISO(deadline)
  const today = startOfDay(new Date())
  const days = differenceInDays(startOfDay(date), today)

  const dateLabel = format(date, 'dd MMM yyyy')

  return { dateLabel, days, isOverdue: days < 0 }
}
