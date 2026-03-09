import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Case } from '@/api/schemas'
import { SEED_STATE } from '@/api/seed'
import { resolveCaseCareRole, useWorklistQueue } from '@/hooks/useWorklistQueue'

describe('worklist queue role filtering', () => {
  it('resolves care role from nextStep when triage decision is missing', () => {
    const base = SEED_STATE.cases[0]
    const caseData: Case = {
      ...base,
      status: 'TRIAGED',
      triageDecision: undefined,
      nextStep: 'NURSE_VISIT',
      assignedRole: undefined,
    }

    expect(resolveCaseCareRole(caseData)).toBe('NURSE')
  })

  it('uses assignedRole fallback for legacy phone cases', () => {
    const base = SEED_STATE.cases[0]
    const caseData: Case = {
      ...base,
      status: 'TRIAGED',
      triageDecision: undefined,
      nextStep: 'PHONE_CALL',
      assignedRole: 'PAL',
    }

    expect(resolveCaseCareRole(caseData)).toBe('DOCTOR')
  })

  it('keeps nurse-filtered queue from becoming empty when legacy cases exist', () => {
    const base = SEED_STATE.cases[0]
    const nurseLegacy: Case = {
      ...base,
      id: 'legacy-nurse-case',
      status: 'TRIAGED',
      triageDecision: undefined,
      nextStep: 'NURSE_VISIT',
      assignedRole: undefined,
      deadline: new Date().toISOString(),
    }

    const { result } = renderHook(() =>
      useWorklistQueue({
        cases: [nurseLegacy],
        patients: SEED_STATE.patients,
        currentUserId: 'user-doc-1',
        filters: {
          categoryFilter: 'ALL',
          careRoleFilter: 'NURSE',
          palOnly: false,
          claimedByMe: false,
          myPatientsOnly: false,
        },
      }),
    )

    expect(result.current.activeCount).toBe(1)
    expect(
      result.current.activeGroupedCases.some((g) => g.cases.some((c) => c.id === nurseLegacy.id)),
    ).toBe(true)
  })
})
