import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import type { Locale } from 'date-fns'
import { setHours, setMinutes } from 'date-fns'
import { enUS, sv } from 'date-fns/locale'
import React from 'react'
import { useTranslation } from 'react-i18next'

// formatPersonnummer is used by PersonalNumberCopy component
import PersonalNumberCopy from '@/components/common/PersonalNumberCopy'

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
  const minTime = setMinutes(setHours(new Date(), 8), 0)
  const maxTime = setMinutes(setHours(new Date(), 17), 0)
  const defaultReference = setMinutes(setHours(new Date(), 12), 30)
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('worklist.completeDialogTitle', { name: patientLabel })}</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <PersonalNumberCopy
            personalNumber={personalNumber ?? undefined}
            labelFormat="long"
            sx={{ pl: 0.5 }}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={adapterLocale}>
            <DateTimePicker
              label={t('worklist.nextContactDate')}
              value={followUpDate}
              onChange={(value) => onFollowUpDateChange(value)}
              slotProps={{
                textField: { size: 'small', helperText: t('worklist.nextContactDateHint') },
              }}
              minTime={minTime}
              maxTime={maxTime}
              referenceDate={defaultReference}
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
      {/* snackbar moved into PersonalNumberCopy */}
    </Dialog>
  )
}
