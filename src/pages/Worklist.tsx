import React, { useMemo, useCallback } from 'react'
import {
  Box,
  Typography,
  Stack,
  Chip,
  Paper,
  Divider,
  Button,
  Tooltip,
  IconButton,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApi } from '@/hooks/useApi'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'
import * as client from '@/api/client'
import StatusChip from '@/components/common/StatusChip'
import DeadlineLabel from '@/components/common/DeadlineLabel'
import WorklistRow from '@/components/worklist/WorklistRow'
import GroupSection from '@/components/worklist/GroupSection'
import type { Case, Patient, Role, NextStep } from '@/api/schemas'
import { formatPersonnummer } from '@/api/utils/personnummer'

/** Roles that can be used to filter assignments */
const FILTER_ROLES: Role[] = ['NURSE', 'DOCTOR', 'PAL']

/** Next-step values that appear in the worklist */
const NEXT_STEP_ORDER: NextStep[] = [
  'DOCTOR_VISIT',
  'NURSE_VISIT',
  'PHYSIO_VISIT',
  'PHONE_CALL',
  'DIGITAL_CONTROL',
]

export default function Worklist() {
  const { t } = useTranslation()
  const { currentUser, isRole } = useRole()
  const { showSnack } = useSnack()

  const [roleFilter, setRoleFilter] = React.useState<Role | null>(
    !isRole('PATIENT') ? (currentUser.role as Role) : null,
  )

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

  const filteredCases = useMemo(() => {
    if (!cases) return []
    if (!roleFilter) return cases
    return cases.filter((c) => c.assignedRole === roleFilter)
  }, [cases, roleFilter])

  const groupedCases = useMemo(() => {
    return NEXT_STEP_ORDER.map((nextStep) => ({
      nextStep,
      cases: filteredCases.filter((c) => c.nextStep === nextStep),
    })).filter((g) => g.cases.length > 0)
  }, [filteredCases])

  const handleBook = useCallback(
    async (caseId: string, scheduledAt?: string) => {
      try {
        if (scheduledAt) {
          const c = cases?.find((x) => x.id === caseId)
          await client.createBooking(
            caseId,
            {
              id: `${caseId}-${Date.now()}`,
              type: c?.nextStep ?? 'NURSE_VISIT',
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
    [cases, currentUser, showSnack, t, refetchCases],
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
    [currentUser, showSnack, t, refetchCases],
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
    [currentUser, showSnack, t, refetchCases],
  )

  const loading = casesLoading || patientsLoading

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        {t('worklist.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {t('worklist.subtitle')}
      </Typography>

      {/* Role filter chips */}
      <Stack direction="row" gap={1} mb={3} flexWrap="wrap">
        <Chip
          label={t('worklist.filterAll')}
          variant={roleFilter === null ? 'filled' : 'outlined'}
          color={roleFilter === null ? 'primary' : 'default'}
          onClick={() => setRoleFilter(null)}
        />
        {FILTER_ROLES.map((r) => (
          <Chip
            key={r}
            label={t(`role.${r}`)}
            variant={roleFilter === r ? 'filled' : 'outlined'}
            color={roleFilter === r ? 'primary' : 'default'}
            onClick={() => setRoleFilter(r)}
          />
        ))}
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
            key={g.nextStep}
            nextStep={g.nextStep}
            cases={g.cases}
            patientMap={patientMap}
            onBook={handleBook}
            onMarkInProgress={handleMarkInProgress}
            onMarkDone={handleMarkDone}
          />
        ))}
    </Box>
  )
}
