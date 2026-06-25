import type { BookingRole, Case, CaseStatus, Role, TriageInput } from '../schemas'
import type { CaseWithActiveCategory } from '../service'
import * as service from '../service'
import { contactModeToWorkCategory } from '../service/triageDecision'
import { withDelay } from './delay'

export const getCases = (): Promise<Case[]> => withDelay(() => service.getCases())

export const getCasesByPatient = (patientId: string): Promise<Case[]> =>
  withDelay(() => service.getCases().filter((c) => c.patientId === patientId))

export const getCase = (id: string): Promise<Case | undefined> =>
  withDelay(() => service.getCase(id))

export const getResponsiblePhysicianUserIdForCase = (caseId: string): Promise<string | null> =>
  withDelay(() => service.resolveResponsiblePhysicianUserIdForCase(caseId))

export const hasPalOwnerForCase = (caseId: string): Promise<boolean> =>
  withDelay(() => service.hasPalOwnerForCase(caseId))

export const triageCase = (
  caseId: string,
  input: TriageInput,
  userId: string,
  userRole: Role,
): Promise<Case> => withDelay(() => service.triageCase(caseId, input, userId, userRole))

export const createBooking = (
  caseId: string,
  booking: {
    id: string
    type: string
    role?: BookingRole
    scheduledAt: string
    note?: string
    createdByUserId: string
    createdAt: string
  },
  userId: string,
  userRole: Role,
): Promise<Case> => withDelay(() => service.createBooking(caseId, booking, userId, userRole))

export const updateBooking = (
  caseId: string,
  bookingId: string,
  patch: {
    scheduledAt?: string
    role?: BookingRole | undefined
    note?: string | undefined
    status?: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
    completedAt?: string | null
    completedByUserId?: string | null
    followUpDate?: string | null
    completionComment?: string | null
  },
  userId: string,
  userRole: Role,
): Promise<Case> =>
  withDelay(() => service.updateBooking(caseId, bookingId, patch, userId, userRole))

export const cancelBooking = (
  caseId: string,
  bookingId: string,
  userId: string,
  userRole: Role,
): Promise<Case> => withDelay(() => service.cancelBooking(caseId, bookingId, userId, userRole))

export const advanceCaseStatus = (
  caseId: string,
  toStatus: CaseStatus,
  userId: string,
  userRole: Role,
): Promise<Case> => withDelay(() => service.advanceCaseStatus(caseId, toStatus, userId, userRole))

export const claimCaseAssignment = (
  caseId: string,
  userId: string,
  userRole: Role,
): Promise<Case> => withDelay(() => service.claimCaseAssignment(caseId, userId, userRole))

export const completeWorklistCase = (
  caseId: string,
  userId: string,
  userRole: Role,
  options?: {
    bookingId?: string
    followUpDate?: string
    completedAt?: string
    completionComment?: string
  },
): Promise<Case> => withDelay(() => service.completeWorklistCase(caseId, userId, userRole, options))

export const getCasesForDashboard = (): Promise<CaseWithActiveCategory[]> =>
  withDelay(() => service.getCasesForDashboard())

/** Returns all cases in TRIAGED or FOLLOWING_UP status that require action, sorted by deadline (overdue first). */
export const getWorklistCases = (): Promise<Case[]> =>
  withDelay(() =>
    service
      .getCases()
      .filter(
        (c) =>
          (c.status === 'TRIAGED' || c.status === 'FOLLOWING_UP') &&
          (c.triageDecision
            ? contactModeToWorkCategory(c.triageDecision.contactMode) !== null
            : c.nextStep !== undefined && c.nextStep !== 'NO_ACTION'),
      )
      .sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }),
  )
