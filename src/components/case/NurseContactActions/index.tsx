import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import PhoneIcon from '@mui/icons-material/Phone'
import { Alert, Button, Stack } from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { ContactAction } from '@/api/client/audit'
import type { Case } from '@/api/schemas'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

/** Triggers that surface the nurse contact action panel */
const CONTACT_TRIGGERS = new Set(['SEEK_CONTACT', 'NOT_OPENED'])

interface Props {
  caseData: Case
  /** Called after logging an event so AuditLogTab can refetch */
  onRefetch: () => void
}

export default function NurseContactActions({ caseData, onRefetch }: Props) {
  const { t } = useTranslation()
  const { currentUser, isRole } = useRole()
  const { showSnack } = useSnack()
  const [loading, setLoading] = useState<ContactAction | null>(null)

  const isClinician = isRole('NURSE', 'DOCTOR')
  // Pick the first matching trigger to drive the suggestion text
  const primaryTrigger = caseData.triggers.find((tr): tr is 'SEEK_CONTACT' | 'NOT_OPENED' =>
    CONTACT_TRIGGERS.has(tr),
  )

  if (!isClinician || !primaryTrigger || caseData.status === 'CLOSED') return null

  async function handle(action: ContactAction) {
    setLoading(action)
    try {
      await client.logContactEvent(caseData.id, currentUser.id, currentUser.role, action)
      showSnack(
        t(action === 'CONTACTED' ? 'nurseContact.contactedDone' : 'nurseContact.remindedDone'),
        'success',
      )
      onRefetch()
    } catch {
      showSnack(t('common.errorGeneric'), 'error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Alert severity="warning" sx={{ mt: 2 }} icon={false}>
      <Stack gap={1.5}>
        <span>{t(`nurseContact.suggestion.${primaryTrigger}`)}</span>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button
            size="small"
            variant="contained"
            startIcon={<PhoneIcon />}
            onClick={() => handle('CONTACTED')}
            disabled={!!loading}
            disableElevation
          >
            {t('nurseContact.contacted')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<NotificationsActiveIcon />}
            onClick={() => handle('REMINDER_SENT')}
            disabled={!!loading}
          >
            {t('nurseContact.reminded')}
          </Button>
        </Stack>
      </Stack>
    </Alert>
  )
}
