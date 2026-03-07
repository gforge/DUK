import { useTranslation } from 'react-i18next'
import type { PatientJourneyStatus } from '@/api/schemas'

// ── helpers ──────────────────────────────────────────────────────────────────

function assertNever(x: never): never {
  throw new Error(`Unhandled enum value: ${String(x)}`)
}

// ── types ─────────────────────────────────────────────────────────────────────

/** Step completion status used by JourneyTimeline. */
export type StepStatus = 'SUBMITTED' | 'UPCOMING' | 'OVERDUE'

// ── hooks ─────────────────────────────────────────────────────────────────────

/** Returns a label function for PatientJourneyStatus (ACTIVE / SUSPENDED / COMPLETED). */
export function useJourneyStatusLabel() {
  const { t } = useTranslation()
  return (status: PatientJourneyStatus): string => {
    switch (status) {
      case 'ACTIVE':
        return t('journey.journeyStatus.ACTIVE')
      case 'SUSPENDED':
        return t('journey.journeyStatus.SUSPENDED')
      case 'COMPLETED':
        return t('journey.journeyStatus.COMPLETED')
      default:
        return assertNever(status)
    }
  }
}

/** Returns a label function for StepStatus (SUBMITTED / UPCOMING / OVERDUE). */
export function useStepStatusLabel() {
  const { t } = useTranslation()
  return (status: StepStatus): string => {
    switch (status) {
      case 'SUBMITTED':
        return t('journey.status.SUBMITTED')
      case 'UPCOMING':
        return t('journey.status.UPCOMING')
      case 'OVERDUE':
        return t('journey.status.OVERDUE')
      default:
        return assertNever(status)
    }
  }
}
