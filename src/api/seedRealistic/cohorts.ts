import type { Cohort } from '../seed/seedHelpers'

/**
 * Cohort definitions for the realistic seed (~320 patients).
 * Each cohort places surgery so that today falls inside a journey window.
 */
export interface RealisticCohort extends Cohort {
  /** Human-readable label for audit events. */
  label: string
}

export const COHORTS: RealisticCohort[] = [
  // ACUTE — Day 1–2 window (offsetDays=1, window=1d → day 0–2)
  { label: 'acute-d1', startDaysAgo: 1, count: 8, triggerProb: 0.4, complexProb: 0.2 },
  { label: 'acute-d2', startDaysAgo: 2, count: 7, triggerProb: 0.3, complexProb: 0.25 },
  // ACUTE — Day 10–14 window (offsetDays=10, window=4d → day 6–14)
  { label: 'acute-d10', startDaysAgo: 10, count: 5, triggerProb: 0.35, complexProb: 0.15 },
  { label: 'acute-d12', startDaysAgo: 12, count: 5, triggerProb: 0.25, complexProb: 0.1 },
  { label: 'acute-d14', startDaysAgo: 14, count: 5, triggerProb: 0.2, complexProb: 0.1 },
  // SUBACUTE — Week 4 window (offsetDays=28, window=3d → day 25–31)
  { label: 'sub-w4', startDaysAgo: 28, count: 10, triggerProb: 0.2, complexProb: 0.1 },
  { label: 'sub-w4b', startDaysAgo: 30, count: 10, triggerProb: 0.15, complexProb: 0.08 },
  // SUBACUTE — Week 6–8 window (offsetDays=49, window=7d → day 42–56)
  { label: 'sub-w6', startDaysAgo: 46, count: 10, triggerProb: 0.2, complexProb: 0.1 },
  { label: 'sub-w8', startDaysAgo: 53, count: 10, triggerProb: 0.15, complexProb: 0.08 },
  // Between phases: week 10–23 (outside all windows)
  { label: 'between-1', startDaysAgo: 70, count: 15, triggerProb: 0.1, complexProb: 0.05 },
  { label: 'between-2', startDaysAgo: 100, count: 15, triggerProb: 0.05, complexProb: 0.05 },
  { label: 'between-3', startDaysAgo: 140, count: 15, triggerProb: 0.08, complexProb: 0.05 },
  // CONTROL — 6 months window (offsetDays=180, window=14d → day 166–194)
  { label: 'ctrl-6m-a', startDaysAgo: 168, count: 35, triggerProb: 0.08, complexProb: 0.05 },
  { label: 'ctrl-6m-b', startDaysAgo: 178, count: 35, triggerProb: 0.05, complexProb: 0.03 },
  { label: 'ctrl-6m-c', startDaysAgo: 185, count: 35, triggerProb: 0.06, complexProb: 0.04 },
  { label: 'ctrl-6m-d', startDaysAgo: 192, count: 35, triggerProb: 0.04, complexProb: 0.03 },
  // Between phases: 6m → 1yr
  { label: 'between-4', startDaysAgo: 230, count: 20, triggerProb: 0.04, complexProb: 0.02 },
  // CONTROL — 1 year window (offsetDays=365, window=14d → day 351–379)
  { label: 'ctrl-1yr-a', startDaysAgo: 355, count: 23, triggerProb: 0.06, complexProb: 0.03 },
  { label: 'ctrl-1yr-b', startDaysAgo: 365, count: 22, triggerProb: 0.04, complexProb: 0.02 },
  { label: 'ctrl-1yr-c', startDaysAgo: 375, count: 22, triggerProb: 0.05, complexProb: 0.02 },
]
