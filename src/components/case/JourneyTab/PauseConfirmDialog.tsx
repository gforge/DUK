import React from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import PauseIcon from '@mui/icons-material/Pause'
import { useTranslation } from 'react-i18next'

interface PauseConfirmDialogProps {
  readonly open: boolean
  readonly loading: boolean
  readonly onClose: () => void
  readonly onConfirm: () => void
}

export default function PauseConfirmDialog({
  open,
  loading,
  onClose,
  onConfirm,
}: PauseConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle>{t('journey.pauseConfirmTitle')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{t('journey.pauseConfirmBody')}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          color="warning"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <PauseIcon />}
        >
          {t('journey.pause')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
