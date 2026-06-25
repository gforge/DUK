import { Alert, Box, Skeleton, Stack } from '@mui/material'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { CareRole, WorkCategory } from '@/api/schemas'
import {
  CompletedSection,
  GroupSection,
  WorklistFilters,
  WorklistHeader,
} from '@/components/worklist'
import { useApi } from '@/hooks/useApi'
import { useWorklistQueue, WORKLIST_CATEGORY_ORDER } from '@/hooks/useWorklistQueue'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

type CategoryFilter = 'ALL' | WorkCategory
type CareRoleFilter = 'ALL' | Exclude<CareRole, null>

export function Worklist() {
  const { t } = useTranslation()
  const { currentUser } = useRole()
  const { showSnack } = useSnack()

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL')
  const [careRoleFilter, setCareRoleFilter] = useState<CareRoleFilter>('ALL')
  const [palOnly, setPalOnly] = useState(false)
  const [claimedByMe, setClaimedByMe] = useState(false)
  const [myPatientsOnly, setMyPatientsOnly] = useState(false)
  const [completedExpanded, setCompletedExpanded] = useState(false)

  const {
    data: cases,
    loading: casesLoading,
    error: casesError,
    refetch: refetchCases,
  } = useApi(() => client.getCases(), [])

  const { data: patients, loading: patientsLoading } = useApi(() => client.getPatients(), [])
  const { data: users, loading: usersLoading } = useApi(() => client.getUsers(), [])

  const userMap = React.useMemo(() => new Map((users ?? []).map((u) => [u.id, u.name])), [users])

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
    currentUserId: currentUser.id,
    filters: {
      categoryFilter,
      careRoleFilter,
      palOnly,
      claimedByMe,
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

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <WorklistHeader
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
        palOnly={palOnly}
        claimedByMe={claimedByMe}
        myPatientsOnly={myPatientsOnly}
        onCategoryFilterChange={setCategoryFilter}
        onCareRoleFilterChange={setCareRoleFilter}
        onPalOnlyToggle={() => setPalOnly((v) => !v)}
        onClaimedByMeToggle={() => setClaimedByMe((v) => !v)}
        onMyPatientsOnlyToggle={() => setMyPatientsOnly((v) => !v)}
      />

      {isInitialLoading && (
        <Stack gap={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      )}

      {casesError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {casesError}
        </Alert>
      )}

      {!isInitialLoading && !casesError && activeGroupedCases.length === 0 && (
        <Alert severity="info">{t('worklist.empty')}</Alert>
      )}

      {!isInitialLoading &&
        !casesError &&
        activeGroupedCases.map((g) => (
          <GroupSection
            key={g.workCategory}
            workCategory={g.workCategory}
            cases={g.cases}
            patientMap={patientMap}
            userMap={userMap}
            highlightedCaseIds={highlightedCaseIds}
            defaultExpanded={g.cases.length <= 6}
            onClaim={handleClaim}
            onMarkDone={handleMarkDone}
          />
        ))}

      {!isInitialLoading && !casesError && monitoringCount > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
            <Alert severity="warning" icon={false} sx={{ py: 0, px: 1 }}>
              {t('worklist.monitoringSectionTitle')} ({monitoringCount})
            </Alert>
          </Stack>
          <Alert severity="info" sx={{ mb: 1.5 }}>
            {t('worklist.monitoringSectionHint')}
          </Alert>
          {monitoringGroupedCases.map((g) => (
            <GroupSection
              key={`monitoring-${g.workCategory}`}
              workCategory={g.workCategory}
              cases={g.cases}
              patientMap={patientMap}
              userMap={userMap}
              highlightedCaseIds={highlightedCaseIds}
              defaultExpanded={false}
              onClaim={handleClaim}
              onMarkDone={handleMarkDone}
            />
          ))}
        </Box>
      )}

      {!isInitialLoading && !casesError && completedCount > 0 && (
        <CompletedSection
          expanded={completedExpanded}
          onToggle={setCompletedExpanded}
          count={completedCount}
        >
          {completedGroupedCases.map((g) => (
            <GroupSection
              key={`completed-${g.workCategory}`}
              workCategory={g.workCategory}
              cases={g.cases}
              patientMap={patientMap}
              userMap={userMap}
              highlightedCaseIds={highlightedCaseIds}
              defaultExpanded={false}
              onClaim={handleClaim}
              onMarkDone={handleMarkDone}
            />
          ))}
        </CompletedSection>
      )}
    </Box>
  )
}
