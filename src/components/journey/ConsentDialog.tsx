import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Typography,
} from '@mui/material'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import * as client from '../../api/client'
import { useSnack } from '../../store/snackContext'
import { useRole } from '../../store/roleContext'
import type { ResearchModule, Consent } from '../../api/schemas'

// ---------------------------------------------------------------------------
// Grant consent dialog
// ---------------------------------------------------------------------------

interface ConsentDialogProps {
  open: boolean
  onClose: () => void
  module: ResearchModule
  patientId: string
  journeyId: string
  onGranted: () => void
}

export function ConsentDialog({
  open,
  onClose,
  module,
  patientId,
  journeyId,
  onGranted,
}: ConsentDialogProps) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const { currentUser } = useRole()
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleGrant = async () => {
    if (!checked || saving) return
    setSaving(true)
    try {
      await client.grantConsent(patientId, module.id, journeyId, currentUser.id)
      showSnack(t('journey.research.consent.grantSuccess'), 'success')
      onGranted()
      onClose()
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('journey.research.consent.dialogTitle', { studyName: module.studyName })}
      </DialogTitle>
      <DialogContent>
        {module.studyInfoMarkdown ? (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              bgcolor: 'action.hover',
              borderRadius: 1,
              borderLeft: 3,
              borderColor: 'primary.light',
              '& p': { mt: 0.5, mb: 0.5, typography: 'body2' },
              '& h2': { typography: 'subtitle1', fontWeight: 700 },
              '& h3': { typography: 'subtitle2', fontWeight: 600 },
            }}
          >
            <Typography variant="overline" color="text.secondary" display="block" mb={0.5}>
              {t('journey.research.consent.infoLabel')}
            </Typography>
            <ReactMarkdown>{module.studyInfoMarkdown}</ReactMarkdown>
          </Box>
        ) : null}

        <Divider sx={{ my: 1.5 }} />

        <FormControlLabel
          control={<Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />}
          label={<Typography variant="body2">{t('journey.research.consent.checkbox')}</Typography>}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleGrant}
          variant="contained"
          disabled={!checked || saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {t('journey.research.consent.grant')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Revoke consent confirmation dialog
// ---------------------------------------------------------------------------

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
}: RevokeConsentDialogProps) {
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
