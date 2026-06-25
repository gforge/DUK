export const REVIEW_TYPES = ['LAB', 'XRAY'] as const
export type ReviewTypeKey = (typeof REVIEW_TYPES)[number]
export type StepStatus = 'SUBMITTED' | 'UPCOMING' | 'OVERDUE'
