import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import type { Locale } from 'date-fns'
import { enUS, sv } from 'date-fns/locale'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { formatPersonnummer } from '@/api/utils/personnummer'

interface CompletionDialogProps {
  open: boolean
  patientLabel: string
  personalNumber?: string | null
  followUpDate: Date | null
  completionComment: string
  isCompleting: boolean
  onClose: () => void
  onFollowUpDateChange: (value: Date | null) => void
  onCompletionCommentChange: (value: string) => void
  onConfirm: () => void
}

export default function CompletionDialog({
  open,
  patientLabel,
  personalNumber,
  followUpDate,
  completionComment,
  isCompleting,
  onClose,
  onFollowUpDateChange,
  onCompletionCommentChange,
  onConfirm,
}: CompletionDialogProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language ?? 'sv'
  const adapterLocale = (language.startsWith('en') ? enUS : sv) as Locale
  const [copiedOpen, setCopiedOpen] = React.useState(false)

  function handleCopy() {
    if (!personalNumber) return
    const normalized = personalNumber.replace(/[-+\s]/g, '')
    const copyText =
      normalized.length === 12 ? `${normalized.slice(0, 8)}-${normalized.slice(8)}` : personalNumber
    void navigator.clipboard.writeText(copyText).then(() => setCopiedOpen(true))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('worklist.completeDialogTitle', { name: patientLabel })}</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ pl: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {t('patient.personalNumber')}:{' '}
              {personalNumber ? formatPersonnummer(personalNumber) : '—'}
            </Typography>
            {personalNumber ? (
              <Tooltip title={t('worklist.copyPersonalNumber')}>
                <IconButton
                  size="small"
                  aria-label={t('worklist.copyPersonalNumber')}
                  onClick={handleCopy}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={adapterLocale}>
            <DateTimePicker
              label={t('worklist.nextContactDate')}
              value={followUpDate}
              onChange={(value) => onFollowUpDateChange(value)}
              slotProps={{
                textField: { size: 'small', helperText: t('worklist.nextContactDateHint') },
              }}
            />
          </LocalizationProvider>
          <TextField
            label={t('worklist.completionComment')}
            size="small"
            multiline
            minRows={2}
            value={completionComment}
            onChange={(e) => onCompletionCommentChange(e.target.value)}
            helperText={t('worklist.completionCommentHint')}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" color="success" onClick={onConfirm} disabled={isCompleting}>
          {t('worklist.confirmDone')}
        </Button>
      </DialogActions>
      <Snackbar
        open={copiedOpen}
        autoHideDuration={1500}
        onClose={() => setCopiedOpen(false)}
        message={t('demoTools.copied')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Dialog>
  )
}
