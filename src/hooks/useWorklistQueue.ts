import { useEffect, useMemo, useRef, useState } from 'react'

import type { CareRole, Case, Patient, WorkCategory } from '@/api/schemas'

export type CategoryFilter = 'ALL' | WorkCategory
export type CareRoleFilter = 'ALL' | Exclude<CareRole, null>

export const WORKLIST_CATEGORY_ORDER: WorkCategory[] = ['VISIT', 'PHONE', 'DIGITAL']

type CategorizedCase = { caseData: Case; category: WorkCategory }
type GroupedCases = Array<{ workCategory: WorkCategory; cases: Case[] }>

interface Filters {
  categoryFilter: CategoryFilter
  careRoleFilter: CareRoleFilter
  palOnly: boolean
  claimedByMe: boolean
  myPatientsOnly: boolean
}

interface Params {
  cases: Case[]
  patients: Patient[]
  currentUserId: string
  filters: Filters
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

  if (caseData.assignedRole === 'DOCTOR' || caseData.assignedRole === 'PAL') return 'DOCTOR'
  if (caseData.assignedRole === 'NURSE') return 'NURSE'
  return null
}

function sortByDeadline(a: Case, b: Case): number {
  if (!a.deadline && !b.deadline) return 0
  if (!a.deadline) return 1
  if (!b.deadline) return -1
  return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
}

function groupCases(items: CategorizedCase[]): GroupedCases {
  return WORKLIST_CATEGORY_ORDER.map((category) => ({
    workCategory: category,
    cases: items
      .filter((item) => item.category === category)
      .map((item) => item.caseData)
      .sort(sortByDeadline),
  })).filter((g) => g.cases.length > 0)
}

export function useWorklistQueue({ cases, patients, currentUserId, filters }: Params) {
  const [pulseCount, setPulseCount] = useState(false)
  const [highlightedCaseIds, setHighlightedCaseIds] = useState<Set<string>>(new Set())

  const previousCaseIdsRef = useRef<Set<string>>(new Set())
  const previousCountRef = useRef(0)

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
      if (filters.categoryFilter !== 'ALL' && category !== filters.categoryFilter) return false
      if (
        filters.careRoleFilter !== 'ALL' &&
        resolveCaseCareRole(caseData) !== filters.careRoleFilter
      ) {
        return false
      }
      if (filters.palOnly && caseData.triageDecision?.assignmentMode !== 'PAL') return false
      if (filters.claimedByMe && caseData.assignedUserId !== currentUserId) return false
      if (filters.myPatientsOnly && patientMap.get(caseData.patientId)?.palId !== currentUserId) {
        return false
      }
      return true
    })
  }, [filters, worklistEligibleCases, currentUserId, patientMap])

  const activeFiltered = useMemo(
    () =>
      filtered.filter(
        (item) => item.caseData.status === 'TRIAGED' || item.caseData.status === 'FOLLOWING_UP',
      ),
    [filtered],
  )

  const completedFiltered = useMemo(
    () => filtered.filter((item) => item.caseData.status === 'CLOSED'),
    [filtered],
  )

  const activeGroupedCases = useMemo(() => groupCases(activeFiltered), [activeFiltered])
  const completedGroupedCases = useMemo(() => groupCases(completedFiltered), [completedFiltered])

  useEffect(() => {
    const currentIds = new Set(activeFiltered.map((item) => item.caseData.id))
    const incoming = [...currentIds].filter((id) => !previousCaseIdsRef.current.has(id))
    previousCaseIdsRef.current = currentIds

    if (incoming.length > 0) {
      setHighlightedCaseIds(new Set(incoming))
      const clearTimer = setTimeout(() => setHighlightedCaseIds(new Set()), 2200)
      return () => clearTimeout(clearTimer)
    }
    return undefined
  }, [activeFiltered])

  useEffect(() => {
    const count = activeFiltered.length
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
  }, [activeFiltered.length])

  return {
    patientMap,
    activeGroupedCases,
    completedGroupedCases,
    activeCount: activeFiltered.length,
    completedCount: completedFiltered.length,
    highlightedCaseIds,
    pulseCount,
  }
}
