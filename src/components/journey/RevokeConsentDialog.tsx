import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { Consent } from '@/api/schemas'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

interface RevokeConsentDialogProps {
  open: boolean
  onClose: () => void
  consent: Consent
  studyName: string
  onRevoked: () => void
}

export function RevokeConsentDialog({
  open,
  onClose,
  consent,
  studyName,
  onRevoked,
}: Readonly<RevokeConsentDialogProps>) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const { currentUser } = useRole()
  const [saving, setSaving] = useState(false)

  const handleRevoke = async () => {
    setSaving(true)
    try {
      await client.revokeConsent(consent.id, currentUser.id)
      showSnack(t('journey.research.consent.revokeSuccess'), 'success')
      onRevoked()
      onClose()
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle>{t('journey.research.consent.revokeConfirmTitle')}</DialogTitle>
      <DialogContent>
        <Alert severity="warning">
          {t('journey.research.consent.revokeConfirmBody', { studyName })}
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleRevoke}
          color="error"
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {t('journey.research.consent.revoke')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
