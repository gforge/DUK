import type { Case } from '@/api/schemas'

const DASHBOARD_BACK_STATUSES = new Set<Case['status']>(['TRIAGED', 'FOLLOWING_UP', 'CLOSED'])

export function getCaseDetailBackPath(caseData?: Pick<Case, 'status' | 'patientId'>): string {
  if (caseData && DASHBOARD_BACK_STATUSES.has(caseData.status)) {
    return '/dashboard'
  }

  return caseData ? `/patients/${caseData.patientId}` : '/patients'
}
