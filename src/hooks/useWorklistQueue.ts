import { differenceInCalendarDays, parseISO } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { AssignmentMode, CareRole, CareTeam, Case, Patient, WorkCategory } from '@/api/schemas'
import { isCaseAssignedToUser } from '@/api/service/teams'

export type CategoryFilter = 'ALL' | WorkCategory
export type CareRoleFilter = 'ALL' | Exclude<CareRole, null>
export type RecipientFilter = 'ALL' | Exclude<AssignmentMode, null>

export const WORKLIST_CATEGORY_ORDER: WorkCategory[] = ['VISIT', 'PHONE', 'DIGITAL']

/** Completed tasks older than this are not shown in the "Avklarade" tab. */
export const COMPLETED_WINDOW_DAYS = 30

type CategorizedCase = { caseData: Case; category: WorkCategory }
export type GroupedCases = Array<{ workCategory: WorkCategory; cases: Case[] }>

export interface WorklistFilters {
  categoryFilter: CategoryFilter
  careRoleFilter: CareRoleFilter
  /** Who the task was sent to (VSH / PAL / named person / team). */
  recipientFilter: RecipientFilter
  /** Only tasks directed at me: claimed, named, sent to my team, or PAL task for my patient. */
  assignedToMe: boolean
  /** Only patients where I am PAL. */
  myPatientsOnly: boolean
}

interface Params {
  cases: Case[]
  patients: Patient[]
  teams?: CareTeam[]
  currentUserId: string
  filters: WorklistFilters
}

function toWorkCategory(caseData: Case): WorkCategory | null {
  const mode = caseData.triageDecision?.contactMode
  if (mode === 'VISIT') return 'VISIT'
  if (mode === 'PHONE') return 'PHONE'
  if (mode === 'DIGITAL') return 'DIGITAL'
  if (mode === 'CLOSE') return null

  if (
    caseData.nextStep === 'DOCTOR_VISIT' ||
    caseData.nextStep === 'NURSE_VISIT' ||
    caseData.nextStep === 'PHYSIO_VISIT'
  ) {
    return 'VISIT'
  }
  if (caseData.nextStep === 'PHONE_CALL') return 'PHONE'
  if (caseData.nextStep === 'DIGITAL_CONTROL') return 'DIGITAL'
  return null
}

export function resolveCaseCareRole(caseData: Case): Exclude<CareRole, null> | null {
  const triageRole = caseData.triageDecision?.careRole
  if (triageRole) return triageRole

  if (caseData.nextStep === 'DOCTOR_VISIT') return 'DOCTOR'
  if (caseData.nextStep === 'NURSE_VISIT') return 'NURSE'
  if (caseData.nextStep === 'PHYSIO_VISIT') return 'PHYSIO'
  return null
}

/**
 * True when the task is directed at the user: the team/named/claimed model via
 * isCaseAssignedToUser, plus unclaimed PAL tasks for patients where the user is PAL.
 */
export function isWorklistTaskMine(
  caseData: Case,
  userId: string,
  teams: CareTeam[],
  patient: Patient | undefined,
): boolean {
  if (isCaseAssignedToUser(caseData, userId, teams)) return true
  return (
    !caseData.assignedUserId &&
    caseData.triageDecision?.assignmentMode === 'PAL' &&
    patient?.palId === userId
  )
}

/** True when the task is directed at someone specific (person, people, team or a PAL). */
function isDirectedAtSomeone(caseData: Case, patient: Patient | undefined): boolean {
  if (caseData.assignedUserId) return true
  const td = caseData.triageDecision
  if (!td) return false
  if (td.assignedUserIds?.length) return true
  if (td.assignmentMode === 'TEAM' && td.assignedTeamIds?.length) return true
  if (td.assignmentMode === 'PAL' && patient?.palId) return true
  return false
}

/** When the task was completed: case closedAt, falling back to last activity. */
export function getCompletedAt(caseData: Case): string | undefined {
  return caseData.closedAt ?? caseData.lastActivityAt
}

/** Who completed the task, taken from the completed booking when recorded. */
export function getCompletedByUserId(caseData: Case): string | undefined {
  const completed = [...(caseData.bookings ?? [])]
    .reverse()
    .find((b) => b.status === 'COMPLETED' && b.completedByUserId)
  return completed?.completedByUserId ?? undefined
}

function sortByDeadline(a: Case, b: Case): number {
  if (!a.deadline && !b.deadline) return 0
  if (!a.deadline) return 1
  if (!b.deadline) return -1
  return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
}

function sortByCompletedDesc(a: Case, b: Case): number {
  return (getCompletedAt(b) ?? '').localeCompare(getCompletedAt(a) ?? '')
}

function groupCases(items: CategorizedCase[], sort: (a: Case, b: Case) => number): GroupedCases {
  return WORKLIST_CATEGORY_ORDER.map((category) => ({
    workCategory: category,
    cases: items
      .filter((item) => item.category === category)
      .map((item) => item.caseData)
      .sort(sort),
  })).filter((g) => g.cases.length > 0)
}

const NO_TEAMS: CareTeam[] = []

export function useWorklistQueue({
  cases,
  patients,
  teams = NO_TEAMS,
  currentUserId,
  filters,
}: Params) {
  const [pulseCount, setPulseCount] = useState(false)
  const [pulseCompletedCount, setPulseCompletedCount] = useState(false)
  const [highlightedCaseIds, setHighlightedCaseIds] = useState<Set<string>>(new Set())

  const previousCaseIdsRef = useRef<Set<string>>(new Set())
  const previousCountRef = useRef(0)
  const previousCompletedCountRef = useRef(0)

  const patientMap = useMemo<Map<string, Patient>>(
    () => new Map(patients.map((p) => [p.id, p])),
    [patients],
  )

  const worklistEligibleCases = useMemo(
    () =>
      cases
        .map((c) => ({ caseData: c, category: toWorkCategory(c) }))
        .filter((item): item is CategorizedCase => item.category !== null),
    [cases],
  )

  const filtered = useMemo(() => {
    return worklistEligibleCases.filter(({ caseData, category }) => {
      const patient = patientMap.get(caseData.patientId)
      if (filters.categoryFilter !== 'ALL' && category !== filters.categoryFilter) return false
      if (
        filters.careRoleFilter !== 'ALL' &&
        resolveCaseCareRole(caseData) !== filters.careRoleFilter
      ) {
        return false
      }
      if (
        filters.recipientFilter !== 'ALL' &&
        (caseData.triageDecision?.assignmentMode ?? 'ANY') !== filters.recipientFilter
      ) {
        return false
      }
      if (filters.assignedToMe && !isWorklistTaskMine(caseData, currentUserId, teams, patient)) {
        return false
      }
      if (filters.myPatientsOnly && patient?.palId !== currentUserId) return false
      return true
    })
  }, [filters, worklistEligibleCases, currentUserId, patientMap, teams])

  const activeFiltered = useMemo(
    () =>
      filtered.filter(
        (item) => item.caseData.status === 'TRIAGED' || item.caseData.status === 'FOLLOWING_UP',
      ),
    [filtered],
  )

  const isActionable = useMemo(
    () => (caseData: Case) => {
      const patient = patientMap.get(caseData.patientId)
      return (
        isWorklistTaskMine(caseData, currentUserId, teams, patient) ||
        !isDirectedAtSomeone(caseData, patient)
      )
    },
    [currentUserId, patientMap, teams],
  )

  const actionableActiveFiltered = useMemo(
    () => activeFiltered.filter((item) => isActionable(item.caseData)),
    [activeFiltered, isActionable],
  )

  const monitoringFiltered = useMemo(
    () => activeFiltered.filter((item) => !isActionable(item.caseData)),
    [activeFiltered, isActionable],
  )

  const completedFiltered = useMemo(() => {
    const today = new Date()
    return filtered.filter((item) => {
      if (item.caseData.status !== 'CLOSED') return false
      const completedAt = getCompletedAt(item.caseData)
      if (!completedAt) return true
      return differenceInCalendarDays(today, parseISO(completedAt)) <= COMPLETED_WINDOW_DAYS
    })
  }, [filtered])

  const activeGroupedCases = useMemo(
    () => groupCases(actionableActiveFiltered, sortByDeadline),
    [actionableActiveFiltered],
  )
  const monitoringGroupedCases = useMemo(
    () => groupCases(monitoringFiltered, sortByDeadline),
    [monitoringFiltered],
  )
  const completedGroupedCases = useMemo(
    () => groupCases(completedFiltered, sortByCompletedDesc),
    [completedFiltered],
  )

  useEffect(() => {
    const currentIds = new Set(actionableActiveFiltered.map((item) => item.caseData.id))
    const incoming = [...currentIds].filter((id) => !previousCaseIdsRef.current.has(id))
    previousCaseIdsRef.current = currentIds

    if (incoming.length > 0) {
      setHighlightedCaseIds(new Set(incoming))
      const clearTimer = setTimeout(() => setHighlightedCaseIds(new Set()), 2200)
      return () => clearTimeout(clearTimer)
    }
    return undefined
  }, [actionableActiveFiltered])

  useEffect(() => {
    const count = actionableActiveFiltered.length
    if (count > previousCountRef.current) {
      const startTimer = setTimeout(() => setPulseCount(true), 0)
      const timer = setTimeout(() => setPulseCount(false), 520)
      previousCountRef.current = count
      return () => {
        clearTimeout(startTimer)
        clearTimeout(timer)
      }
    }
    previousCountRef.current = count
    return undefined
  }, [actionableActiveFiltered.length])

  useEffect(() => {
    const count = completedFiltered.length
    if (count > previousCompletedCountRef.current) {
      const startTimer = setTimeout(() => setPulseCompletedCount(true), 0)
      const timer = setTimeout(() => setPulseCompletedCount(false), 520)
      previousCompletedCountRef.current = count
      return () => {
        clearTimeout(startTimer)
        clearTimeout(timer)
      }
    }
    previousCompletedCountRef.current = count
    return undefined
  }, [completedFiltered.length])

  return {
    patientMap,
    activeGroupedCases,
    monitoringGroupedCases,
    completedGroupedCases,
    activeCount: actionableActiveFiltered.length,
    monitoringCount: monitoringFiltered.length,
    completedCount: completedFiltered.length,
    highlightedCaseIds,
    pulseCount,
    pulseCompletedCount,
  }
}
