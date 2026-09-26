import { Alert, Skeleton, Stack } from '@mui/material'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { WorklistTab } from '@/components/worklist'
import { GroupSection, WorklistFilters, WorklistHeader } from '@/components/worklist'
import { useApi } from '@/hooks/useApi'
import { useCollapsedSections } from '@/hooks/useCollapsedSections'
import type { CareRoleFilter, CategoryFilter, RecipientFilter } from '@/hooks/useWorklistQueue'
import { useWorklistQueue, WORKLIST_CATEGORY_ORDER } from '@/hooks/useWorklistQueue'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

export function Worklist() {
  const { t } = useTranslation()
  const { currentUser } = useRole()
  const { showSnack } = useSnack()
  const [tab, setTab] = useState<WorklistTab>('active')
  const groupsState = useCollapsedSections<string>('worklist.collapsedGroups')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL')
  const [careRoleFilter, setCareRoleFilter] = useState<CareRoleFilter>('ALL')
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>('ALL')
  const [assignedToMe, setAssignedToMe] = useState(false)
  const [myPatientsOnly, setMyPatientsOnly] = useState(false)
  const {
    data: cases,
    loading: casesLoading,
    error: casesError,
    refetch: refetchCases,
  } = useApi(() => client.getCases(), [])
  const { data: patients, loading: patientsLoading } = useApi(() => client.getPatients(), [])
  const { data: users, loading: usersLoading } = useApi(() => client.getUsers(), [])
  const { data: teams } = useApi(() => client.getCareTeams(), [])
  const userMap = React.useMemo(() => new Map((users ?? []).map((u) => [u.id, u.name])), [users])
  const teamMap = React.useMemo(() => new Map((teams ?? []).map((tm) => [tm.id, tm])), [teams])
  const {
    patientMap,
    activeGroupedCases,
    monitoringGroupedCases,
    completedGroupedCases,
    activeCount,
    monitoringCount,
    completedCount,
    highlightedCaseIds,
    pulseCount,
    pulseCompletedCount,
  } = useWorklistQueue({
    cases: cases ?? [],
    patients: patients ?? [],
    teams: teams ?? undefined,
    currentUserId: currentUser.id,
    filters: {
      categoryFilter,
      careRoleFilter,
      recipientFilter,
      assignedToMe,
      myPatientsOnly,
    },
  })
  const loading = casesLoading || patientsLoading || usersLoading
  const isInitialLoading = loading && (!cases || !patients || !users)
  const handleClaim = useCallback(
    async (caseId: string) => {
      try {
        await client.claimCaseAssignment(caseId, currentUser.id, currentUser.role)
        showSnack(t('worklist.claimSuccess'), 'success')
        refetchCases()
      } catch (err) {
        showSnack(t('common.error') + ': ' + String(err), 'error')
      }
    },
    [currentUser, refetchCases, showSnack, t],
  )
  const handleMarkDone = useCallback(
    async (
      caseId: string,
      options?: {
        bookingId?: string
        followUpDate?: string
        completionComment?: string
      },
    ) => {
      try {
        const worklistCase = cases?.find((c) => c.id === caseId)
        if (!worklistCase) throw new Error(`Case ${caseId} not found`)
        if (worklistCase.status === 'TRIAGED') {
          await client.advanceCaseStatus(caseId, 'FOLLOWING_UP', currentUser.id, currentUser.role)
        }
        await client.completeWorklistCase(caseId, currentUser.id, currentUser.role, options)
        showSnack(t('worklist.doneSuccess'), 'success')
        refetchCases()
      } catch (err) {
        showSnack(t('common.error') + ': ' + String(err), 'error')
      }
    },
    [cases, currentUser, refetchCases, showSnack, t],
  )

  const groups =
    tab === 'active'
      ? activeGroupedCases
      : tab === 'monitoring'
        ? monitoringGroupedCases
        : completedGroupedCases
  const emptyText =
    tab === 'active'
      ? t('worklist.empty')
      : tab === 'monitoring'
        ? t('worklist.emptyMonitoring')
        : t('worklist.emptyCompleted')

  return (
    <Stack sx={{ gap: 2.5 }}>
      <WorklistHeader
        tab={tab}
        onTabChange={setTab}
        activeCount={activeCount}
        monitoringCount={monitoringCount}
        completedCount={completedCount}
        pulseCount={pulseCount}
        pulseCompletedCount={pulseCompletedCount}
      />

      <WorklistFilters
        categoryOrder={WORKLIST_CATEGORY_ORDER}
        categoryFilter={categoryFilter}
        careRoleFilter={careRoleFilter}
        recipientFilter={recipientFilter}
        assignedToMe={assignedToMe}
        myPatientsOnly={myPatientsOnly}
        onCategoryFilterChange={setCategoryFilter}
        onCareRoleFilterChange={setCareRoleFilter}
        onRecipientFilterChange={setRecipientFilter}
        onAssignedToMeToggle={() => setAssignedToMe((v) => !v)}
        onMyPatientsOnlyToggle={() => setMyPatientsOnly((v) => !v)}
      />

      {isInitialLoading && (
        <Stack sx={{ gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" sx={{ borderRadius: 3, height: 80 }} />
          ))}
        </Stack>
      )}

      {casesError && <Alert severity="error">{casesError}</Alert>}

      {!isInitialLoading && !casesError && (
        <Stack
          id="worklist-tabpanel"
          role="tabpanel"
          aria-labelledby={`worklist-tab-${tab}`}
          sx={{ gap: 2.5 }}
        >
          {groups.length === 0 && <Alert severity="info">{emptyText}</Alert>}
          {groups.map((g) => (
            <GroupSection
              key={`${tab}-${g.workCategory}`}
              workCategory={g.workCategory}
              cases={g.cases}
              mode={tab}
              patientMap={patientMap}
              userMap={userMap}
              teamMap={teamMap}
              highlightedCaseIds={highlightedCaseIds}
              open={groupsState.isOpen(g.workCategory)}
              onToggleOpen={() => groupsState.toggle(g.workCategory)}
              onClaim={handleClaim}
              onMarkDone={handleMarkDone}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}
