import { useTranslation } from 'react-i18next'

import type { AssignmentMode, CareRole, ContactMode } from '@/api/schemas'

import { assertNever } from './never'

// ── hooks ─────────────────────────────────────────────────────────────────────

/** Returns a label function for ContactMode. */
export function useContactModeLabel() {
  const { t } = useTranslation()
  return (mode: ContactMode): string => {
    switch (mode) {
      case 'DIGITAL':
        return t('triage.contactMode.DIGITAL')
      case 'PHONE':
        return t('triage.contactMode.PHONE')
      case 'VISIT':
        return t('triage.contactMode.VISIT')
      case 'CLOSE':
        return t('triage.contactMode.CLOSE')
      default:
        return assertNever(mode)
    }
  }
}

/** Returns a help text function for ContactMode. */
export function useContactModeHelpLabel() {
  const { t } = useTranslation()
  return (mode: ContactMode): string => {
    switch (mode) {
      case 'DIGITAL':
        return t('triage.contactModeHelp.DIGITAL')
      case 'PHONE':
        return t('triage.contactModeHelp.PHONE')
      case 'VISIT':
        return t('triage.contactModeHelp.VISIT')
      case 'CLOSE':
        return t('triage.contactModeHelp.CLOSE')
      default:
        return assertNever(mode)
    }
  }
}

/** Returns a label function for CareRole. */
export function useCareRoleLabel() {
  const { t } = useTranslation()
  return (role: Exclude<CareRole, null>): string => {
    switch (role) {
      case 'DOCTOR':
        return t('triage.careRoleOption.DOCTOR')
      case 'NURSE':
        return t('triage.careRoleOption.NURSE')
      case 'PHYSIO':
        return t('triage.careRoleOption.PHYSIO')
      default:
        return assertNever(role)
    }
  }
}

/** Returns a label function for AssignmentMode. */
export function useAssignmentModeLabel() {
  const { t } = useTranslation()
  return (mode: Exclude<AssignmentMode, null>): string => {
    switch (mode) {
      case 'ANY':
        return t('triage.assignmentModeOption.ANY')
      case 'PAL':
        return t('triage.assignmentModeOption.PAL')
      case 'NAMED':
        return t('triage.assignmentModeOption.NAMED')
      default:
        return assertNever(mode)
    }
  }
}

/** Returns a help text function for AssignmentMode. */
export function useAssignmentModeHelpLabel() {
  const { t } = useTranslation()
  return (mode: Exclude<AssignmentMode, null>): string => {
    switch (mode) {
      case 'ANY':
        return t('triage.assignmentModeHelp.ANY')
      case 'PAL':
        return t('triage.assignmentModeHelp.PAL')
      case 'NAMED':
        return t('triage.assignmentModeHelp.NAMED')
      default:
        return assertNever(mode)
    }
  }
}

/**
 * Returns the title text for step 2 of the triage form depending on the contact
 * mode.  We keep a hook so that each literal key is visible to the i18n extractor
 * (vs. building the key dynamically from a map object).
 */
export function useStep2TitleLabel() {
  const { t } = useTranslation()
  return (mode: ContactMode): string => {
    switch (mode) {
      case 'DIGITAL':
        return t('triage.step2TitleByMode.DIGITAL')
      case 'PHONE':
        return t('triage.step2TitleByMode.PHONE')
      case 'VISIT':
        return t('triage.step2TitleByMode.VISIT')
      case 'CLOSE':
        return t('triage.step2TitleByMode.CLOSE')
      default:
        return assertNever(mode)
    }
  }
}
