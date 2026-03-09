import { Alert, Box, Chip, Skeleton, Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { CareRole, Case, Patient, WorkCategory } from '@/api/schemas'
import { GroupSection } from '@/components/worklist'
import { useApi } from '@/hooks/useApi'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

type CategoryFilter = 'ALL' | WorkCategory
type CareRoleFilter = 'ALL' | Exclude<CareRole, null>

const CATEGORY_ORDER: WorkCategory[] = ['VISIT', 'PHONE', 'DIGITAL']

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

export function Worklist() {
  const { t } = useTranslation()
  const tr = (key: string) => t(key as never)
  const { currentUser } = useRole()
  const { showSnack } = useSnack()

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL')
  const [careRoleFilter, setCareRoleFilter] = useState<CareRoleFilter>('ALL')
  const [palOnly, setPalOnly] = useState(false)
  const [claimedByMe, setClaimedByMe] = useState(false)
  const [myPatientsOnly, setMyPatientsOnly] = useState(false)
  const [pulseCount, setPulseCount] = useState(false)
  const [highlightedCaseIds, setHighlightedCaseIds] = useState<Set<string>>(new Set())

  const previousCaseIdsRef = useRef<Set<string>>(new Set())
  const previousCountRef = useRef(0)

  const {
    data: cases,
    loading: casesLoading,
    error: casesError,
    refetch: refetchCases,
  } = useApi(() => client.getWorklistCases(), [])

  const { data: patients, loading: patientsLoading } = useApi(() => client.getPatients(), [])

  const patientMap = useMemo<Map<string, Patient>>(() => {
    if (!patients) return new Map()
    return new Map(patients.map((p) => [p.id, p]))
  }, [patients])

  const casesWithCategory = useMemo(
    () =>
      (cases ?? [])
        .map((c) => ({ caseData: c, category: toWorkCategory(c) }))
        .filter(
          (item): item is { caseData: Case; category: WorkCategory } => item.category !== null,
        ),
    [cases],
  )

  const filtered = useMemo(() => {
    return casesWithCategory.filter(({ caseData, category }) => {
      if (categoryFilter !== 'ALL' && category !== categoryFilter) return false
      if (careRoleFilter !== 'ALL' && caseData.triageDecision?.careRole !== careRoleFilter)
        return false
      if (palOnly && caseData.triageDecision?.assignmentMode !== 'PAL') return false
      if (claimedByMe && caseData.assignedUserId !== currentUser.id) return false
      if (myPatientsOnly && patientMap.get(caseData.patientId)?.palId !== currentUser.id)
        return false
      return true
    })
  }, [
    casesWithCategory,
    categoryFilter,
    careRoleFilter,
    palOnly,
    claimedByMe,
    myPatientsOnly,
    currentUser.id,
    patientMap,
  ])

  const groupedCases = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        workCategory: category,
        cases: filtered
          .filter((item) => item.category === category)
          .map((item) => item.caseData)
          .sort((a, b) => {
            if (!a.deadline && !b.deadline) return 0
            if (!a.deadline) return 1
            if (!b.deadline) return -1
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          }),
      })).filter((g) => g.cases.length > 0),
    [filtered],
  )

  useEffect(() => {
    const currentIds = new Set((cases ?? []).map((c) => c.id))
    const incoming = [...currentIds].filter((id) => !previousCaseIdsRef.current.has(id))
    previousCaseIdsRef.current = currentIds

    if (incoming.length > 0) {
      setHighlightedCaseIds(new Set(incoming))
      const clearTimer = setTimeout(() => setHighlightedCaseIds(new Set()), 2200)
      return () => clearTimeout(clearTimer)
    }
    return undefined
  }, [cases])

  useEffect(() => {
    const count = filtered.length
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
  }, [filtered.length])

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
        showSnack(t('worklist.claimSuccess' as never), 'success')
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

  const loading = casesLoading || patientsLoading

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
        <Typography variant="h5" fontWeight={700}>
          {t('worklist.title')}
        </Typography>
        <Chip
          label={filtered.length}
          color="primary"
          sx={
            pulseCount
              ? {
                  animation: 'worklistPulse 0.5s ease-in-out',
                  '@keyframes worklistPulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.14)' },
                    '100%': { transform: 'scale(1)' },
                  },
                }
              : undefined
          }
        />
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {t('worklist.subtitle')}
      </Typography>

      <Stack direction="row" gap={1} mb={1.5} flexWrap="wrap">
        <Chip
          label={tr('worklist.filterAll')}
          variant={categoryFilter === 'ALL' ? 'filled' : 'outlined'}
          color={categoryFilter === 'ALL' ? 'primary' : 'default'}
          onClick={() => setCategoryFilter('ALL')}
        />
        {CATEGORY_ORDER.map((category) => (
          <Chip
            key={category}
            label={tr(`worklist.category.${category}`)}
            variant={categoryFilter === category ? 'filled' : 'outlined'}
            color={categoryFilter === category ? 'primary' : 'default'}
            onClick={() => setCategoryFilter(category)}
          />
        ))}
      </Stack>

      <Stack direction="row" gap={1} mb={3} flexWrap="wrap">
        {(['DOCTOR', 'NURSE', 'PHYSIO'] as const).map((role) => (
          <Chip
            key={role}
            label={tr(`triage.careRoleOption.${role}`)}
            variant={careRoleFilter === role ? 'filled' : 'outlined'}
            onClick={() => setCareRoleFilter(careRoleFilter === role ? 'ALL' : role)}
          />
        ))}
        <Chip
          label={tr('triage.assignmentModeOption.PAL')}
          variant={palOnly ? 'filled' : 'outlined'}
          onClick={() => setPalOnly((v) => !v)}
        />
        <Chip
          label={tr('worklist.filterClaimedByMe')}
          variant={claimedByMe ? 'filled' : 'outlined'}
          onClick={() => setClaimedByMe((v) => !v)}
        />
        <Chip
          label={tr('worklist.filterMyPatients')}
          variant={myPatientsOnly ? 'filled' : 'outlined'}
          onClick={() => setMyPatientsOnly((v) => !v)}
        />
      </Stack>

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

      {!loading && !casesError && groupedCases.length === 0 && (
        <Alert severity="info">{t('worklist.empty')}</Alert>
      )}

      {!loading &&
        !casesError &&
        groupedCases.map((g) => (
          <GroupSection
            key={g.workCategory}
            workCategory={g.workCategory}
            cases={g.cases}
            patientMap={patientMap}
            highlightedCaseIds={highlightedCaseIds}
            onBook={handleBook}
            onClaim={handleClaim}
            onMarkInProgress={handleMarkInProgress}
            onMarkDone={handleMarkDone}
          />
        ))}
    </Box>
  )
}
