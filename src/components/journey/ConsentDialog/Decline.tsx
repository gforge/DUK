import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

interface DeclineConsentDialogProps {
  open: boolean
  onClose: () => void
  studyName: string
  /** 'decline' = patient never consented; 'withdraw' = revoking an existing consent. */
  mode: 'decline' | 'withdraw'
  patientId: string
  researchModuleId: string
  journeyId: string
  /** Required only in 'withdraw' mode. */
  consentId?: string
  onDone: () => void
}

export function DeclineConsentDialog({
  open,
  onClose,
  studyName,
  mode,
  patientId,
  researchModuleId,
  journeyId,
  consentId,
  onDone,
}: Readonly<DeclineConsentDialogProps>) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const { currentUser } = useRole()
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    setSaving(true)
    try {
      const trimmedReason = reason.trim() || undefined
      if (mode === 'withdraw' && consentId) {
        await client.revokeConsent(consentId, currentUser.id, trimmedReason)
        showSnack(t('journey.research.consent.revokeSuccess'), 'success')
      } else {
        await client.declineConsent(
          patientId,
          researchModuleId,
          journeyId,
          currentUser.id,
          trimmedReason,
        )
        showSnack(t('journey.research.consent.declineSuccess'), 'success')
      }
      onDone()
      onClose()
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const isWithdraw = mode === 'withdraw'

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t(
          isWithdraw
            ? 'journey.research.consent.withdrawTitle'
            : 'journey.research.consent.declineTitle',
          { studyName },
        )}
      </DialogTitle>
      <DialogContent>
        <Alert severity={isWithdraw ? 'warning' : 'info'} sx={{ mb: 2 }}>
          {t(
            isWithdraw
              ? 'journey.research.consent.withdrawBody'
              : 'journey.research.consent.declineBody',
            { studyName },
          )}
        </Alert>
        <TextField
          label={t('journey.research.consent.reasonLabel')}
          placeholder={t('journey.research.consent.reasonPlaceholder')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={3}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={isWithdraw ? 'error' : 'warning'}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {t(
            isWithdraw
              ? 'journey.research.consent.withdrawConfirm'
              : 'journey.research.consent.declineConfirm',
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
