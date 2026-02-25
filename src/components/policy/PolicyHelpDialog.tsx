import React from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

interface Props {
  open: boolean
  onClose: () => void
}

export default function PolicyHelpDialog({ open, onClose }: Props) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('policy.syntaxTitle')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          {t('policy.syntaxDescription')}
        </Typography>
        <Box
          component="pre"
          sx={{
            bgcolor: 'background.default',
            p: 1.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontFamily: 'monospace',
          }}
        >
          {`PNRS_1 >= 7\nOSS.total < 22 && PNRS_2 > 5\nEQ5D.index <= 0.5 || EQ_VAS < 30\n(OSS.total + PNRS_1) > 25`}
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {t('policy.operators')}: {`< <= > >= == != && ||`}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  )
}
