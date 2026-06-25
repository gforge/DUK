import { useTranslation } from 'react-i18next'

import type {
  EpisodeOfCareStatus,
  JourneyModificationType,
  PatientJourneyStatus,
  PhaseType,
  QuestionType,
  TransitionTriggerType,
} from '@/api/schemas'

import { assertNever } from './never'

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

/** Returns a label function for PhaseType. */
export function usePhaseTypeLabel() {
  const { t } = useTranslation()
  return (phase: PhaseType): string => {
    switch (phase) {
      case 'REFERRAL':
        return t('journey.phaseType.REFERRAL')
      case 'INTAKE':
        return t('journey.phaseType.INTAKE')
      case 'FOLLOWUP':
        return t('journey.phaseType.FOLLOWUP')
      case 'WAITING_LIST':
        return t('journey.phaseType.WAITING_LIST')
      case 'POST_OP':
        return t('journey.phaseType.POST_OP')
      case 'MONITORING':
        return t('journey.phaseType.MONITORING')
      case 'DISCHARGE':
        return t('journey.phaseType.DISCHARGE')
      default:
        return assertNever(phase)
    }
  }
}

/** Returns a label function for TransitionTriggerType. */
export function useTransitionTriggerLabel() {
  const { t } = useTranslation()
  return (trigger: TransitionTriggerType): string => {
    switch (trigger) {
      case 'REFERRAL_RECEIVED':
        return t('journey.transitionTrigger.REFERRAL_RECEIVED')
      case 'TRIAGE_DECISION':
        return t('journey.transitionTrigger.TRIAGE_DECISION')
      case 'VISIT_DECISION':
        return t('journey.transitionTrigger.VISIT_DECISION')
      case 'SURGERY_SCHEDULED':
        return t('journey.transitionTrigger.SURGERY_SCHEDULED')
      case 'SURGERY_COMPLETED':
        return t('journey.transitionTrigger.SURGERY_COMPLETED')
      case 'PHYSIO_COMPLETED':
        return t('journey.transitionTrigger.PHYSIO_COMPLETED')
      case 'MILESTONE':
        return t('journey.transitionTrigger.MILESTONE')
      case 'MANUAL':
        return t('journey.transitionTrigger.MANUAL')
      default:
        return assertNever(trigger)
    }
  }
}

/** Returns a label function for EpisodeOfCareStatus. */
export function useEpisodeStatusLabel() {
  const { t } = useTranslation()
  return (status: EpisodeOfCareStatus): string => {
    switch (status) {
      case 'OPEN':
        return t('episode.status.OPEN')
      case 'COMPLETED':
        return t('episode.status.COMPLETED')
      case 'DISCHARGED':
        return t('episode.status.DISCHARGED')
      default:
        return assertNever(status)
    }
  }
}

/** Returns a label function for JourneyModificationType. */
export function useJourneyModificationTypeLabel() {
  const { t } = useTranslation()
  return (type: JourneyModificationType): string => {
    switch (type) {
      case 'ADD_STEP':
        return t('journey.modType.ADD_STEP')
      case 'REMOVE_STEP':
        return t('journey.modType.REMOVE_STEP')
      case 'CANCEL':
        return t('journey.modType.CANCEL')
      default:
        return assertNever(type)
    }
  }
}

/** Returns a label function for questionnaire QuestionType. */
export function useQuestionTypeLabel() {
  const { t } = useTranslation()
  return (type: QuestionType): string => {
    switch (type) {
      case 'SCALE':
        return t('questionType.SCALE')
      case 'BOOLEAN':
        return t('questionType.BOOLEAN')
      case 'TEXT':
        return t('questionType.TEXT')
      case 'SELECT':
        return t('questionType.SELECT')
      case 'NUMBER':
        return t('questionType.NUMBER')
      default:
        return assertNever(type)
    }
  }
}
