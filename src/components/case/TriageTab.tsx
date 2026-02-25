import React from 'react'
import { Box, Button, Stack, Alert } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { Case } from '../../api/schemas'
import { useRole } from '../../store/roleContext'
import { useSnack } from '../../store/snackContext'
import * as client from '../../api/client'
import type { Role } from '../../api/schemas'
import TriageForm from './triage/TriageForm'
import type { TriageForm as TriageFormData } from './triage/TriageForm'

interface TriageTabProps {
  caseData: Case
  onTriaged: () => void
}

export default function TriageTab({ caseData, onTriaged }: TriageTabProps) {
  const { t } = useTranslation()
  const { currentUser, isRole } = useRole()
  const { showSnack } = useSnack()

  const canTriage = isRole('NURSE', 'DOCTOR', 'PAL')

  async function onSubmit(data: TriageFormData) {
    try {
      const deadline = data.deadline ? new Date(data.deadline).toISOString() : undefined
      // If a booking was scheduled from the triage, create it first
      if (data.bookingTime) {
        const booking = {
          id: `${caseData.id}-${Date.now()}`,
          type: data.nextStep,
          role: data.bookingRole as unknown as Role | undefined,
          scheduledAt: new Date(data.bookingTime).toISOString(),
          note: data.bookingNote ?? undefined,
          createdByUserId: currentUser.id,
          createdAt: new Date().toISOString(),
        }
        await client.createBooking(caseData.id, booking, currentUser.id, currentUser.role)
      }

      await client.triageCase(caseData.id, { ...data, deadline }, currentUser.id, currentUser.role)
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
        {t('role.currentRole')}: {t(`role.${currentUser.role}`)}. Triage requires clinical staff
        access.
      </Alert>
    )
  }

  return (
    <Box>
      {(caseData.status === 'NEW' || caseData.status === 'NEEDS_REVIEW') && (
        <TriageForm caseData={caseData} onSubmit={onSubmit} />
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
