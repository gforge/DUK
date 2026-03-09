import { Alert, Box, Button, Stack } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { Case } from '@/api/schemas'
import ClinicalReviewPanel from '@/components/case/ClinicalReviewPanel'
import { useRoleLabel } from '@/hooks/labels'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

import type { TriageSubmitData } from '../triage/TriageForm'
import TriageForm from '../triage/TriageForm'

interface TriageTabProps {
  readonly caseData: Case
  readonly onTriaged: () => void
}

export default function TriageTab({ caseData, onTriaged }: TriageTabProps) {
  const { t } = useTranslation()
  const { currentUser, isRole } = useRole()
  const { showSnack } = useSnack()
  const getRoleLabel = useRoleLabel()

  const canTriage = isRole('NURSE', 'DOCTOR', 'PAL')

  async function onSubmit(data: TriageSubmitData) {
    try {
      await client.triageCase(caseData.id, data, currentUser.id, currentUser.role)
      showSnack(t('triage.success'), 'success')
      onTriaged()
    } catch (err) {
      showSnack(`${t('triage.error')}: ${String(err)}`, 'error')
    }
  }

  async function handleFollowUp() {
    try {
      await client.advanceCaseStatus(caseData.id, 'FOLLOWING_UP', currentUser.id, currentUser.role)
      showSnack(t('triage.followUp'), 'info')
      onTriaged()
    } catch (err) {
      showSnack(String(err), 'error')
    }
  }

  async function handleClose() {
    try {
      await client.advanceCaseStatus(caseData.id, 'CLOSED', currentUser.id, currentUser.role)
      showSnack(t('triage.close'), 'success')
      onTriaged()
    } catch (err) {
      showSnack(String(err), 'error')
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
          <TriageForm caseData={caseData} onSubmit={onSubmit} />
        </>
      )}

      {caseData.status === 'TRIAGED' && (
        <Stack direction="row" gap={1}>
          <Button variant="outlined" size="small" onClick={handleFollowUp}>
            {t('triage.followUp')}
          </Button>
          <Button variant="outlined" color="success" size="small" onClick={handleClose}>
            {t('triage.close')}
          </Button>
        </Stack>
      )}

      {caseData.status === 'FOLLOWING_UP' && (
        <Button variant="outlined" color="success" size="small" onClick={handleClose}>
          {t('triage.close')}
        </Button>
      )}

      {caseData.status === 'CLOSED' && <Alert severity="success">{t('status.CLOSED')}</Alert>}
    </Box>
  )
}
