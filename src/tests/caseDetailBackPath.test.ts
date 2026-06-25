import { describe, expect, it } from 'vitest'

import { getCaseDetailBackPath } from '@/utils'

describe('getCaseDetailBackPath', () => {
  it('returns patient path for NEW and NEEDS_REVIEW', () => {
    expect(getCaseDetailBackPath({ status: 'NEW', patientId: 'p-1' })).toBe('/patients/p-1')
    expect(getCaseDetailBackPath({ status: 'NEEDS_REVIEW', patientId: 'p-2' })).toBe(
      '/patients/p-2',
    )
  })

  it('returns dashboard path for triage-completed statuses', () => {
    expect(getCaseDetailBackPath({ status: 'TRIAGED', patientId: 'p-1' })).toBe('/dashboard')
    expect(getCaseDetailBackPath({ status: 'FOLLOWING_UP', patientId: 'p-1' })).toBe('/dashboard')
    expect(getCaseDetailBackPath({ status: 'CLOSED', patientId: 'p-1' })).toBe('/dashboard')
  })

  it('falls back to patients list when case data is missing', () => {
    expect(getCaseDetailBackPath()).toBe('/patients')
  })
})
