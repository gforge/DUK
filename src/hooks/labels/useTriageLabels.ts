import { useTranslation } from 'react-i18next'

import type { AssignmentMode, CareRole, CareTeam, ContactMode, User } from '@/api/schemas'

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
      case 'TEAM':
        return t('triage.assignmentModeOption.TEAM')
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
      case 'TEAM':
        return t('triage.assignmentModeHelp.TEAM')
      default:
        return assertNever(mode)
    }
  }
}

/**
 * Returns the heading for the "who" step of the triage form. Without a chosen
 * contact mode the generic (digital) wording is used.
 */
export function useWhoLabel() {
  const { t } = useTranslation()
  return (mode: ContactMode | null): string => {
    switch (mode) {
      case 'PHONE':
        return t('triage.whoLabel.PHONE')
      case 'VISIT':
        return t('triage.whoLabel.VISIT')
      case 'DIGITAL':
      case 'CLOSE':
      case null:
        return t('triage.whoLabel.DIGITAL')
      default:
        return assertNever(mode)
    }
  }
}

interface AssigneeSource {
  readonly assignmentMode: AssignmentMode
  readonly careRole?: CareRole
  readonly assignedUserId?: string | null
  readonly assignedUserIds?: string[]
  readonly assignedTeamIds?: string[]
}

/**
 * Returns a formatter for who a triage decision is directed at: "VSH", "PAL",
 * the chosen people or the chosen teams. Returns null when nothing is chosen.
 */
export function useAssigneeLabel() {
  const getModeLabel = useAssignmentModeLabel()
  return (
    source: AssigneeSource,
    users: readonly User[] | null | undefined,
    teams: readonly CareTeam[] | null | undefined,
  ): string | null => {
    const mode = source.assignmentMode
    if (!mode) return null
    if (mode === 'NAMED') {
      const ids = source.assignedUserIds?.length
        ? source.assignedUserIds
        : source.assignedUserId
          ? [source.assignedUserId]
          : []
      if (ids.length === 0) return null
      return ids.map((id) => users?.find((u) => u.id === id)?.name ?? id).join(', ')
    }
    if (mode === 'TEAM') {
      const ids = source.assignedTeamIds ?? []
      if (ids.length === 0) return null
      return ids.map((id) => teams?.find((tm) => tm.id === id)?.name ?? id).join(', ')
    }
    return getModeLabel(mode)
  }
}
