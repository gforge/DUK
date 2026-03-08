import CancelIcon from '@mui/icons-material/Cancel'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CancelJourneyDialogProps {
  readonly open: boolean
  readonly loading: boolean
  readonly hasData: boolean
  readonly onClose: () => void
  readonly onConfirm: (reason: string) => void
}

export default function CancelJourneyDialog({
  open,
  loading,
  hasData,
  onClose,
  onConfirm,
}: CancelJourneyDialogProps) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')

  const handleClose = () => {
    setReason('')
    onClose()
  }

  const handleConfirm = () => {
    if (reason.trim().length < 5) return
    onConfirm(reason.trim())
    setReason('')
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('journey.cancelConfirmTitle')}</DialogTitle>
      <DialogContent>
        <Alert severity={hasData ? 'warning' : 'error'} sx={{ mb: 2 }}>
          <Typography variant="body2">
            {hasData ? t('journey.cancelConfirmBodyHasData') : t('journey.cancelConfirmBodyNoData')}
          </Typography>
        </Alert>
        <TextField
          label={t('journey.cancelReasonLabel')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          minRows={2}
          fullWidth
          required
          error={reason.length > 0 && reason.trim().length < 5}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={loading || reason.trim().length < 5}
          startIcon={loading ? <CircularProgress size={16} /> : <CancelIcon />}
        >
          {t('journey.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
