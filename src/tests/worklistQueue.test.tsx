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

  it('does not infer care role from assignedRole for legacy phone cases', () => {
    const base = SEED_STATE.cases[0]
    const caseData: Case = {
      ...base,
      status: 'TRIAGED',
      triageDecision: undefined,
      nextStep: 'PHONE_CALL',
      assignedRole: 'PAL',
    }

    expect(resolveCaseCareRole(caseData)).toBeNull()
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

  it('splits active cases into actionable and monitoring buckets', () => {
    const base = SEED_STATE.cases[0]
    const mine: Case = {
      ...base,
      id: 'active-mine',
      status: 'TRIAGED',
      nextStep: 'NURSE_VISIT',
      triageDecision: {
        contactMode: 'VISIT',
        careRole: 'NURSE',
        assignmentMode: 'NAMED',
        assignedUserId: 'user-nurse-1',
        dueAt: null,
        note: null,
      },
      assignedUserId: 'user-nurse-1',
    }
    const unclaimed: Case = {
      ...base,
      id: 'active-unclaimed',
      status: 'TRIAGED',
      nextStep: 'NURSE_VISIT',
      triageDecision: {
        contactMode: 'VISIT',
        careRole: 'NURSE',
        assignmentMode: 'ANY',
        assignedUserId: null,
        dueAt: null,
        note: null,
      },
      assignedUserId: undefined,
    }
    const others: Case = {
      ...base,
      id: 'active-others',
      status: 'FOLLOWING_UP',
      nextStep: 'NURSE_VISIT',
      triageDecision: {
        contactMode: 'VISIT',
        careRole: 'NURSE',
        assignmentMode: 'NAMED',
        assignedUserId: 'user-nurse-2',
        dueAt: null,
        note: null,
      },
      assignedUserId: 'user-nurse-2',
    }

    const { result } = renderHook(() =>
      useWorklistQueue({
        cases: [mine, unclaimed, others],
        patients: SEED_STATE.patients,
        currentUserId: 'user-nurse-1',
        filters: {
          categoryFilter: 'ALL',
          careRoleFilter: 'ALL',
          palOnly: false,
          claimedByMe: false,
          myPatientsOnly: false,
        },
      }),
    )

    expect(result.current.activeCount).toBe(2)
    expect(result.current.monitoringCount).toBe(1)
    expect(
      result.current.activeGroupedCases.some((g) => g.cases.some((c) => c.id === mine.id)),
    ).toBe(true)
    expect(
      result.current.activeGroupedCases.some((g) => g.cases.some((c) => c.id === unclaimed.id)),
    ).toBe(true)
    expect(
      result.current.monitoringGroupedCases.some((g) => g.cases.some((c) => c.id === others.id)),
    ).toBe(true)
  })
})
