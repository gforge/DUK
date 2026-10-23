export type OffsetUnit = 'days' | 'weeks' | 'months' | 'years'
export const UNIT_DAYS: Record<OffsetUnit, number> = { days: 1, weeks: 7, months: 30, years: 365 }
/** Picks the largest unit that expresses the offset exactly. */
export function inferOffsetUnit(days: number): OffsetUnit {
  if (days >= 365 && days % 365 === 0) return 'years'
  if (days >= 60 && days % 30 === 0) return 'months'
  if (days >= 14 && days % 7 === 0) return 'weeks'
  return 'days'
}
