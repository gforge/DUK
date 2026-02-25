import type { Role, NextStep } from '../../../api/schemas'

export type TriageActionKey =
  | 'DIGITAL_CONTROL'
  | 'PHONE_CALL'
  | 'NURSE_VISIT'
  | 'DOCTOR_VISIT'
  | 'PHYSIO_VISIT'
  | 'CLOSE_NOW'

export interface ActionConfig {
  /** The NextStep value written to the case on submit */
  nextStep: NextStep
  /** Whether to also immediately close the case after triaging */
  closeImmediately: boolean
  /** Role pre-filled in assignedRole; null = leave empty */
  defaultAssignedRole: Role | null
  /** Default deadline relative shorthand, e.g. '14d'. null = no deadline field */
  defaultDeadlineShorthand: string | null
  /** Whether deadline is required for this action */
  deadlineRequired: boolean
  showDeadline: boolean
  showPatientMessage: boolean
  showInternalNote: boolean
  showAssignedRole: boolean
  /** Whether this action may create a booking/appointment */
  allowBooking?: boolean
  /** Roles recommended/allowed for booking (optional) */
  bookingRoles?: Role[]
}

export const ACTION_CONFIG: Record<TriageActionKey, ActionConfig> = {
  DIGITAL_CONTROL: {
    nextStep: 'DIGITAL_CONTROL',
    closeImmediately: false,
    defaultAssignedRole: 'NURSE',
    defaultDeadlineShorthand: '2v',
    deadlineRequired: true,
    showDeadline: true,
    showPatientMessage: true,
    showInternalNote: true,
    showAssignedRole: true,
    allowBooking: false,
    bookingRoles: ['NURSE'],
  },
  PHONE_CALL: {
    nextStep: 'PHONE_CALL',
    closeImmediately: false,
    defaultAssignedRole: 'NURSE',
    defaultDeadlineShorthand: '3d',
    deadlineRequired: true,
    showDeadline: true,
    showPatientMessage: false,
    showInternalNote: true,
    showAssignedRole: true,
    allowBooking: true,
    bookingRoles: ['NURSE'],
  },
  NURSE_VISIT: {
    nextStep: 'NURSE_VISIT',
    closeImmediately: false,
    defaultAssignedRole: 'NURSE',
    defaultDeadlineShorthand: '1v',
    deadlineRequired: true,
    showDeadline: true,
    showPatientMessage: false,
    showInternalNote: true,
    showAssignedRole: true,
    allowBooking: true,
    bookingRoles: ['NURSE'],
  },
  DOCTOR_VISIT: {
    nextStep: 'DOCTOR_VISIT',
    closeImmediately: false,
    defaultAssignedRole: 'DOCTOR',
    defaultDeadlineShorthand: '2v',
    deadlineRequired: true,
    showDeadline: true,
    showPatientMessage: false,
    showInternalNote: true,
    showAssignedRole: true,
    allowBooking: true,
    bookingRoles: ['DOCTOR', 'NURSE'],
  },
  PHYSIO_VISIT: {
    nextStep: 'PHYSIO_VISIT',
    closeImmediately: false,
    defaultAssignedRole: null,
    defaultDeadlineShorthand: '2v',
    deadlineRequired: true,
    showDeadline: true,
    showPatientMessage: false,
    showInternalNote: true,
    showAssignedRole: true,
    allowBooking: true,
    bookingRoles: ['PAL'],
  },
  CLOSE_NOW: {
    nextStep: 'NO_ACTION',
    closeImmediately: true,
    defaultAssignedRole: null,
    defaultDeadlineShorthand: null,
    deadlineRequired: false,
    showDeadline: false,
    showPatientMessage: false,
    showInternalNote: true,
    showAssignedRole: false,
  },
}

export const ACTION_ORDER: TriageActionKey[] = [
  'DIGITAL_CONTROL',
  'PHONE_CALL',
  'NURSE_VISIT',
  'DOCTOR_VISIT',
  'PHYSIO_VISIT',
  'CLOSE_NOW',
]
