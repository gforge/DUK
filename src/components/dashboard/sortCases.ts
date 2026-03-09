import type { Patient } from '@/api/schemas'
import type { CaseWithActiveCategory } from '@/api/service'

export type SortMode = 'time' | 'flags' | 'name'

/** Positive = overdue (in the past), negative = upcoming */
const overdueDays = (c: CaseWithActiveCategory) =>
  (Date.now() - new Date(c.scheduledAt).getTime()) / 86_400_000

/** Higher = more flags */
const flagScore = (c: CaseWithActiveCategory) =>
  c.policyWarnings.filter((w) => w.severity === 'HIGH').length * 4 +
  c.policyWarnings.filter((w) => w.severity === 'MEDIUM').length * 2 +
  c.policyWarnings.filter((w) => w.severity === 'LOW').length +
  c.triggers.length

export function sortCases(
  cases: CaseWithActiveCategory[],
  mode: SortMode,
  patientMap: Map<string, Patient>,
): CaseWithActiveCategory[] {
  const displayName = (c: CaseWithActiveCategory) =>
    patientMap.get(c.patientId)?.displayName ?? c.patientId

  return [...cases].sort((a, b) => {
    // Keep triaged rows at the bottom so users can track handoff movement.
    if (a.status === 'TRIAGED' && b.status !== 'TRIAGED') return 1
    if (b.status === 'TRIAGED' && a.status !== 'TRIAGED') return -1

    switch (mode) {
      case 'name':
        return displayName(a).localeCompare(displayName(b), 'sv')

      case 'flags': {
        const fd = flagScore(b) - flagScore(a)
        if (fd !== 0) return fd
        const td = overdueDays(b) - overdueDays(a)
        if (Math.abs(td) > 0.5) return td > 0 ? 1 : -1
        return displayName(a).localeCompare(displayName(b), 'sv')
      }

      default: {
        // 'time': most overdue first, then flags, then name
        const td = overdueDays(b) - overdueDays(a)
        if (Math.abs(td) > 0.5) return td > 0 ? 1 : -1
        const fd = flagScore(b) - flagScore(a)
        if (fd !== 0) return fd
        return displayName(a).localeCompare(displayName(b), 'sv')
      }
    }
  })
}
