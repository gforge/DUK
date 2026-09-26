import type { Case, Role } from '../schemas'
import * as service from '../service'
import { withDelay } from './delay'

export const requestColleagueReview = (
  caseId: string,
  reviewerUserId: string,
  question: string | null,
  userId: string,
  userRole: Role,
): Promise<Case> =>
  withDelay(() => service.requestColleagueReview(caseId, reviewerUserId, question, userId, userRole))

export const respondColleagueReview = (
  caseId: string,
  reviewId: string,
  response: string,
  userId: string,
  userRole: Role,
): Promise<Case> =>
  withDelay(() => service.respondColleagueReview(caseId, reviewId, response, userId, userRole))

export const cancelColleagueReview = (
  caseId: string,
  reviewId: string,
  userId: string,
  userRole: Role,
): Promise<Case> =>
  withDelay(() => service.cancelColleagueReview(caseId, reviewId, userId, userRole))
