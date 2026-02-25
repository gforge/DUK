/**
 * Helpers shared between seedRealistic and seedFaker.
 * Both use identical cohort shapes, trigger values, and date arithmetic.
 */

// ─── Cohort shape ─────────────────────────────────────────────────────────────

export interface Cohort {
  /** Surgery date = today minus this many days */
  startDaysAgo: number
  count: number
  triggerProb: number
  complexProb: number
}

// ─── Shared constants ─────────────────────────────────────────────────────────

export const TRIGGERS = [
  'HIGH_PAIN',
  'NO_RESPONSE',
  'NOT_OPENED',
  'INFECTION_SUSPECTED',
  'LOW_FUNCTION',
  'LOW_QOL',
] as const

export type TriggerValue = (typeof TRIGGERS)[number]

export const PAL_IDS = ['user-pal-1', 'user-doc-1'] as const

// ─── Offset-based date helpers ────────────────────────────────────────────────
// These differ from seed/shared.ts which accepts a Date object.
// Here daysOffset may be negative (past) or positive (future).

const MS_PER_DAY = 86_400_000

const todayMs = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
})()

/** YYYY-MM-DD string, offset days from today (negative = past). */
export function isoDateOffset(daysOffset: number): string {
  return new Date(todayMs + daysOffset * MS_PER_DAY).toISOString().slice(0, 10)
}

/** Full ISO timestamp, offset days from today (negative = past). */
export function isoTsOffset(daysOffset: number): string {
  return new Date(todayMs + daysOffset * MS_PER_DAY).toISOString()
}
