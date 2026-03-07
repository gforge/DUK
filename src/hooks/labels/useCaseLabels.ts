import { useTranslation } from 'react-i18next'
import type {
  CaseStatus,
  CaseCategory,
  TriggerType,
  ReviewType,
  ReviewOutcome,
  NextStep,
} from '@/api/schemas'

// ── helpers ──────────────────────────────────────────────────────────────────

function assertNever(x: never): never {
  throw new Error(`Unhandled enum value: ${String(x)}`)
}

type Severity = 'LOW' | 'MEDIUM' | 'HIGH'

// ── hooks ─────────────────────────────────────────────────────────────────────

/**
 * Returns a label function for CaseStatus.
 * Pass isPatientView=true to get patient-friendly copy for NEEDS_REVIEW.
 */
export function useStatusLabel() {
  const { t } = useTranslation()
  return (status: CaseStatus, _isPatientView = false): string => {
    switch (status) {
      case 'NEW':
        return t('status.NEW')
      case 'NEEDS_REVIEW':
        return t('status.NEEDS_REVIEW')
      case 'TRIAGED':
        return t('status.TRIAGED')
      case 'FOLLOWING_UP':
        return t('status.FOLLOWING_UP')
      case 'CLOSED':
        return t('status.CLOSED')
      default:
        return assertNever(status)
    }
  }
}

/** Returns a label function for CaseCategory. */
export function useCategoryLabel() {
  const { t } = useTranslation()
  return (category: CaseCategory): string => {
    switch (category) {
      case 'ACUTE':
        return t('category.ACUTE')
      case 'SUBACUTE':
        return t('category.SUBACUTE')
      case 'CONTROL':
        return t('category.CONTROL')
      default:
        return assertNever(category)
    }
  }
}

/** Returns a description label function for CaseCategory (used in QueueColumn headers). */
export function useCategoryDescLabel() {
  const { t } = useTranslation()
  return (category: CaseCategory): string => {
    switch (category) {
      case 'ACUTE':
        return t('category.ACUTE_desc')
      case 'SUBACUTE':
        return t('category.SUBACUTE_desc')
      case 'CONTROL':
        return t('category.CONTROL_desc')
      default:
        return assertNever(category)
    }
  }
}

/** Returns a label function for TriggerType. */
export function useTriggerLabel() {
  const { t } = useTranslation()
  return (trigger: TriggerType): string => {
    switch (trigger) {
      case 'NO_RESPONSE':
        return t('trigger.NO_RESPONSE')
      case 'NOT_OPENED':
        return t('trigger.NOT_OPENED')
      case 'HIGH_PAIN':
        return t('trigger.HIGH_PAIN')
      case 'INFECTION_SUSPECTED':
        return t('trigger.INFECTION_SUSPECTED')
      case 'LOW_FUNCTION':
        return t('trigger.LOW_FUNCTION')
      case 'LOW_QOL':
        return t('trigger.LOW_QOL')
      case 'SEEK_CONTACT':
        return t('trigger.SEEK_CONTACT')
      case 'ABNORMAL_ANSWER':
        return t('trigger.ABNORMAL_ANSWER')
      case 'LAB_PENDING':
        return t('trigger.LAB_PENDING')
      case 'XRAY_PENDING':
        return t('trigger.XRAY_PENDING')
      default:
        return assertNever(trigger)
    }
  }
}

/** Returns a label function for policy/warning severity. */
export function useSeverityLabel() {
  const { t } = useTranslation()
  return (severity: Severity): string => {
    switch (severity) {
      case 'LOW':
        return t('severity.LOW')
      case 'MEDIUM':
        return t('severity.MEDIUM')
      case 'HIGH':
        return t('severity.HIGH')
      default:
        return assertNever(severity)
    }
  }
}

/** Returns a label function for ReviewType. */
export function useReviewTypeLabel() {
  const { t } = useTranslation()
  return (type: ReviewType): string => {
    switch (type) {
      case 'LAB':
        return t('reviewType.LAB')
      case 'XRAY':
        return t('reviewType.XRAY')
      default:
        return assertNever(type)
    }
  }
}

/** Returns a label function for ReviewOutcome. */
export function useReviewOutcomeLabel() {
  const { t } = useTranslation()
  return (outcome: ReviewOutcome): string => {
    switch (outcome) {
      case 'OK':
        return t('reviewOutcome.OK')
      case 'UNCERTAIN':
        return t('reviewOutcome.UNCERTAIN')
      case 'PROBLEM':
        return t('reviewOutcome.PROBLEM')
      default:
        return assertNever(outcome)
    }
  }
}

/** Returns a label function for NextStep. */
export function useNextStepLabel() {
  const { t } = useTranslation()
  return (next: NextStep): string => {
    switch (next) {
      case 'DIGITAL_CONTROL':
        return t('nextStep.DIGITAL_CONTROL')
      case 'DOCTOR_VISIT':
        return t('nextStep.DOCTOR_VISIT')
      case 'NURSE_VISIT':
        return t('nextStep.NURSE_VISIT')
      case 'PHYSIO_VISIT':
        return t('nextStep.PHYSIO_VISIT')
      case 'PHONE_CALL':
        return t('nextStep.PHONE_CALL')
      case 'NO_ACTION':
        return t('nextStep.NO_ACTION')
      default:
        return assertNever(next)
    }
  }
}
