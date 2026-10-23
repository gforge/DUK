import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Case } from '@/api/schemas'
import { SEED_STATE } from '@/api/seed'
import {
  COMPLETED_WINDOW_DAYS,
  resolveCaseCareRole,
  useWorklistQueue,
} from '@/hooks/useWorklistQueue'

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
      assignedRole: 'DOCTOR',
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
          recipientFilter: 'ALL',
          assignedToMe: false,
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
          recipientFilter: 'ALL',
          assignedToMe: false,
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

  it('treats team and multi-person assignments naming me as mine', () => {
    const base = SEED_STATE.cases[0]
    const make = (
      id: string,
      triageDecision: Partial<NonNullable<Case['triageDecision']>>,
    ): Case => ({
      ...base,
      id,
      status: 'TRIAGED',
      nextStep: 'NURSE_VISIT',
      assignedUserId: undefined,
      triageDecision: {
        contactMode: 'VISIT',
        careRole: 'NURSE',
        assignmentMode: 'NAMED',
        assignedUserId: null,
        dueAt: null,
        note: null,
        ...triageDecision,
      },
    })
    const myTeam = make('team-mine', { assignmentMode: 'TEAM', assignedTeamIds: ['team-a'] })
    const otherTeam = make('team-other', { assignmentMode: 'TEAM', assignedTeamIds: ['team-b'] })
    const namedWithMe = make('named-with-me', { assignedUserIds: ['user-nurse-1', 'user-nurse-2'] })
    const namedWithoutMe = make('named-without-me', {
      assignedUserIds: ['user-nurse-2', 'user-doc-1'],
    })
    const teams = [
      { id: 'team-a', name: 'Höft', memberUserIds: ['user-nurse-1'] },
      { id: 'team-b', name: 'Trauma', memberUserIds: ['user-nurse-2'] },
    ]
    const baseFilters = {
      categoryFilter: 'ALL',
      careRoleFilter: 'ALL',
      recipientFilter: 'ALL',
      assignedToMe: false,
      myPatientsOnly: false,
    } as const

    const { result } = renderHook(() =>
      useWorklistQueue({
        cases: [myTeam, otherTeam, namedWithMe, namedWithoutMe],
        patients: SEED_STATE.patients,
        teams,
        currentUserId: 'user-nurse-1',
        filters: baseFilters,
      }),
    )
    const ids = (groups: typeof result.current.activeGroupedCases) =>
      groups.flatMap((g) => g.cases.map((c) => c.id)).sort()
    expect(ids(result.current.activeGroupedCases)).toEqual(['named-with-me', 'team-mine'])
    expect(ids(result.current.monitoringGroupedCases)).toEqual(['named-without-me', 'team-other'])

    const { result: mineOnly } = renderHook(() =>
      useWorklistQueue({
        cases: [myTeam, otherTeam, namedWithMe, namedWithoutMe],
        patients: SEED_STATE.patients,
        teams,
        currentUserId: 'user-nurse-1',
        filters: { ...baseFilters, assignedToMe: true },
      }),
    )
    expect(mineOnly.current.activeCount).toBe(2)
    expect(mineOnly.current.monitoringCount).toBe(0)
  })

  it('only lists cases completed within the completed window', () => {
    const base = SEED_STATE.cases[0]
    const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
    const closed = (id: string, closedAt: string): Case => ({
      ...base,
      id,
      status: 'CLOSED',
      nextStep: 'PHONE_CALL',
      triageDecision: undefined,
      closedAt,
      lastActivityAt: closedAt,
    })
    const { result } = renderHook(() =>
      useWorklistQueue({
        cases: [closed('recent', daysAgo(3)), closed('old', daysAgo(COMPLETED_WINDOW_DAYS + 5))],
        patients: SEED_STATE.patients,
        currentUserId: 'user-nurse-1',
        filters: {
          categoryFilter: 'ALL',
          careRoleFilter: 'ALL',
          recipientFilter: 'ALL',
          assignedToMe: false,
          myPatientsOnly: false,
        },
      }),
    )
    expect(result.current.completedCount).toBe(1)
    expect(result.current.completedGroupedCases[0].cases[0].id).toBe('recent')
  })
})
