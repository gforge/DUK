import { Alert, Box, Divider, Paper, Stack, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import * as client from '@/api/client'
import type { Case, ContactMode } from '@/api/schemas'
import ClinicalReviewPanel from '@/components/case/ClinicalReviewPanel'
import { useRoleLabel } from '@/hooks/labels'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

import { contactModeToRouteSegment } from '../triage/routeContactMode'
import type { TriageSubmitData } from '../triage/TriageForm'
import TriageForm from '../triage/TriageForm'

interface TriageTabProps {
  readonly caseData: Case
  readonly onTriaged: () => void
  readonly routeContactMode: ContactMode | null
}

function TriageDecisionSummary({ caseData }: { caseData: Case }) {
  const { t } = useTranslation()
  const td = caseData.triageDecision
  if (!td) return null

  const rows: { label: string; value: string | null | undefined }[] = [
    { label: t('triage.step1Title'), value: t(`triage.contactMode.${td.contactMode}`) },
    td.careRole
      ? { label: t('triage.careRole'), value: t(`triage.careRoleOption.${td.careRole}`) }
      : null,
    td.assignmentMode
      ? {
          label: t('triage.assignRole'),
          value: t(`triage.assignmentModeOption.${td.assignmentMode}`),
        }
      : null,
    td.dueAt ? { label: t('triage.dueAt'), value: td.dueAt.slice(0, 10) } : null,
    td.note ? { label: t('triage.note'), value: td.note } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        {t('triage.decisionSummary')}
      </Typography>
      <Divider sx={{ mb: 1.5 }} />
      <Stack gap={0.75}>
        {rows.map(({ label, value }) => (
          <Stack key={label} direction="row" gap={1}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
              {label}
            </Typography>
            <Typography variant="body2">{value}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  )
}

export default function TriageTab({ caseData, onTriaged, routeContactMode }: TriageTabProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentUser, isRole } = useRole()
  const { showSnack } = useSnack()
  const getRoleLabel = useRoleLabel()

  const canTriage = isRole('NURSE', 'DOCTOR')

  // determine if any lab/xray reviews are pending for this case
  const hasPendingReviews = React.useMemo(
    () => (caseData.reviews ?? []).some((r) => r.reviewedAt === null),
    [caseData.reviews],
  )

  async function onSubmit(data: TriageSubmitData) {
    try {
      await client.triageCase(caseData.id, data, currentUser.id, currentUser.role)
      showSnack(t('triage.success'), 'success')
      onTriaged()
    } catch (err) {
      console.error('Error triaging case:', err)
      showSnack(`${t('triage.error')}: ${String(err)}`, 'error')
    }
  }

  if (!canTriage) {
    return (
      <Alert severity="info">
        {t('role.currentRole')}: {getRoleLabel(currentUser.role)}. {t('triage.requiresClinician')}
      </Alert>
    )
  }

  return (
    <Box>
      {(caseData.status === 'NEW' || caseData.status === 'NEEDS_REVIEW') && (
        <>
          <ClinicalReviewPanel caseData={caseData} onRefetch={onTriaged} />
          {hasPendingReviews ? (
            <Alert severity="warning">{t('triage.pendingReviews')}</Alert>
          ) : (
            <TriageForm
              caseData={caseData}
              onSubmit={onSubmit}
              contactModeFromRoute={routeContactMode}
              onContactModeRouteChange={(mode) => {
                if (!mode) {
                  navigate(`/cases/${caseData.id}`)
                  return
                }
                navigate(`/cases/${caseData.id}/${contactModeToRouteSegment(mode)}`)
              }}
            />
          )}
        </>
      )}

      {caseData.status === 'TRIAGED' && (
        <>
          <TriageDecisionSummary caseData={caseData} />
          <Alert severity="info">{t('triage.handledInWorklist')}</Alert>
        </>
      )}

      {caseData.status === 'FOLLOWING_UP' && (
        <>
          <TriageDecisionSummary caseData={caseData} />
          <Alert severity="info">{t('triage.followingUpInWorklist')}</Alert>
        </>
      )}

      {caseData.status === 'CLOSED' && <Alert severity="success">{t('status.CLOSED')}</Alert>}
    </Box>
  )
}
