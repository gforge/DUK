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

  const {
    patientMap,
    activeGroupedCases,
    completedGroupedCases,
    activeCount,
    completedCount,
    highlightedCaseIds,
    pulseCount,
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

  const loading = casesLoading || patientsLoading

  const handleBook = useCallback(
    async (caseId: string, scheduledAt?: string) => {
      try {
        if (scheduledAt) {
          const c = cases?.find((x) => x.id === caseId)
          await client.createBooking(
            caseId,
            {
              id: `${caseId}-${Date.now()}`,
              type: c?.nextStep ?? 'DOCTOR_VISIT',
              scheduledAt,
              createdByUserId: currentUser.id,
              createdAt: new Date().toISOString(),
            },
            currentUser.id,
            currentUser.role,
          )
        }
        await client.advanceCaseStatus(caseId, 'FOLLOWING_UP', currentUser.id, currentUser.role)
        showSnack(t('worklist.bookSuccess'), 'success')
        refetchCases()
      } catch (err) {
        showSnack(t('common.error') + ': ' + String(err), 'error')
      }
    },
    [cases, currentUser, refetchCases, showSnack, t],
  )

  const handleMarkInProgress = useCallback(
    async (caseId: string) => {
      try {
        await client.advanceCaseStatus(caseId, 'FOLLOWING_UP', currentUser.id, currentUser.role)
        showSnack(t('triage.followUp'), 'success')
        refetchCases()
      } catch (err) {
        showSnack(t('common.error') + ': ' + String(err), 'error')
      }
    },
    [currentUser, refetchCases, showSnack, t],
  )

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
    async (caseId: string) => {
      try {
        await client.advanceCaseStatus(caseId, 'CLOSED', currentUser.id, currentUser.role)
        showSnack(t('worklist.doneSuccess'), 'success')
        refetchCases()
      } catch (err) {
        showSnack(t('common.error') + ': ' + String(err), 'error')
      }
    },
    [currentUser, refetchCases, showSnack, t],
  )

  return (
    <Box>
      <WorklistHeader
        activeCount={activeCount}
        completedCount={completedCount}
        pulseCount={pulseCount}
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

      {loading && (
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

      {!loading && !casesError && activeGroupedCases.length === 0 && (
        <Alert severity="info">{t('worklist.empty')}</Alert>
      )}

      {!loading &&
        !casesError &&
        activeGroupedCases.map((g) => (
          <GroupSection
            key={g.workCategory}
            workCategory={g.workCategory}
            cases={g.cases}
            patientMap={patientMap}
            highlightedCaseIds={highlightedCaseIds}
            defaultExpanded={g.cases.length <= 6}
            onBook={handleBook}
            onClaim={handleClaim}
            onMarkInProgress={handleMarkInProgress}
            onMarkDone={handleMarkDone}
          />
        ))}

      {!loading && !casesError && completedCount > 0 && (
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
              highlightedCaseIds={highlightedCaseIds}
              defaultExpanded={false}
              onBook={handleBook}
              onClaim={handleClaim}
              onMarkInProgress={handleMarkInProgress}
              onMarkDone={handleMarkDone}
            />
          ))}
        </CompletedSection>
      )}
    </Box>
  )
}
