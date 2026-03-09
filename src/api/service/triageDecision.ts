import type {
  AssignmentMode,
  CareRole,
  ContactMode,
  NextStep,
  TriageDecision,
  WorkCategory,
} from '../schemas'

export function contactModeToWorkCategory(mode: ContactMode): WorkCategory | null {
  switch (mode) {
    case 'VISIT':
      return 'VISIT'
    case 'PHONE':
      return 'PHONE'
    case 'DIGITAL':
      return 'DIGITAL'
    case 'CLOSE':
      return null
    default:
      return null
  }
}

export function triageDecisionToNextStep(decision: TriageDecision): NextStep {
  if (decision.contactMode === 'CLOSE') return 'NO_ACTION'
  if (decision.contactMode === 'PHONE') return 'PHONE_CALL'
  if (decision.contactMode === 'DIGITAL') return 'DIGITAL_CONTROL'

  switch (decision.careRole) {
    case 'DOCTOR':
      return 'DOCTOR_VISIT'
    case 'NURSE':
      return 'NURSE_VISIT'
    case 'PHYSIO':
      return 'PHYSIO_VISIT'
    default:
      return 'DOCTOR_VISIT'
  }
}

export function careRoleToAssignedRole(careRole: CareRole): 'DOCTOR' | 'NURSE' | 'PAL' | undefined {
  switch (careRole) {
    case 'DOCTOR':
      return 'DOCTOR'
    case 'NURSE':
      return 'NURSE'
    case 'PHYSIO':
      return undefined
    case null:
      return undefined
    default:
      return undefined
  }
}

export function assignmentModeToAssignedRole(
  assignmentMode: AssignmentMode,
  careRole: CareRole,
): 'DOCTOR' | 'NURSE' | 'PAL' | undefined {
  if (assignmentMode === 'PAL') return 'PAL'
  return careRoleToAssignedRole(careRole)
}
