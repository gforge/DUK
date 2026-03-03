import * as service from '../service/reviews'
import type { ClinicalReview, ReviewType, Role, ReviewOutcome } from '../schemas'
import { withDelay } from './delay'

export const createReview = (
  caseId: string,
  type: ReviewType,
  userId: string,
  userRole: Role,
  source?: 'JOURNEY' | 'MANUAL',
  initialNote?: string,
): Promise<ClinicalReview> =>
  withDelay(() => service.createReview(caseId, type, userId, userRole, source, initialNote))

export const completeReview = (
  reviewId: string,
  caseId: string,
  userId: string,
  userRole: Role,
  outcome: ReviewOutcome,
  note?: string,
): Promise<ClinicalReview> =>
  withDelay(() => service.completeReview(reviewId, caseId, userId, userRole, outcome, note))

export const deleteReview = (reviewId: string, caseId: string): Promise<void> =>
  withDelay(() => service.deleteReview(reviewId, caseId))

export const getPendingReviews = (caseId: string): Promise<ClinicalReview[]> =>
  withDelay(() => service.getPendingReviews(caseId))

export const getAllReviews = (caseId: string): Promise<ClinicalReview[]> =>
  withDelay(() => service.getAllReviews(caseId))

export const updateCaseTriggersForReviews = (caseId: string): Promise<void> =>
  withDelay(() => service.updateCaseTriggersForReviews(caseId))
