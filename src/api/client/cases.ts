import * as service from '../service'
import type { Case, CaseStatus, TriageInput, Role } from '../schemas'
import type { CaseWithActiveCategory } from '../service'
import { withDelay } from './delay'

export const getCases = (): Promise<Case[]> => withDelay(() => service.getCases())

export const getCasesByPatient = (patientId: string): Promise<Case[]> =>
  withDelay(() => service.getCases().filter((c) => c.patientId === patientId))

export const getCase = (id: string): Promise<Case | undefined> =>
  withDelay(() => service.getCase(id))

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
    role?: Role
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
    role?: Role | undefined
    note?: string | undefined
    status?: 'PENDING' | 'SCHEDULED' | 'CANCELLED'
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

export const getCasesForDashboard = (): Promise<CaseWithActiveCategory[]> =>
  withDelay(() => service.getCasesForDashboard())
