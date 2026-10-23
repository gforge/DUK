import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import SendIcon from '@mui/icons-material/Send'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { tokens } from '@/theme'

import { PATIENT_MESSAGE_MAX } from './schema'

interface Props {
  readonly open: boolean
  /** Message typed in the form so far; editable here before closing. */
  readonly initialMessage: string
  readonly confirmLabel: string
  readonly onCancel: () => void
  readonly onConfirm: (patientMessage: string) => void
}

/**
 * Closing a case is the "all is well" outcome, so the clinician gets one last chance to
 * tell the patient so. The message is optional and is shown in the patient app.
 */
export function CloseCaseDialog({
  open,
  initialMessage,
  confirmLabel,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      {/* MUI unmounts the dialog body when closed, so the draft resets on every open. */}
      <CloseCaseBody
        initialMessage={initialMessage}
        confirmLabel={confirmLabel}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </Dialog>
  )
}

function CloseCaseBody({ initialMessage, confirmLabel, onCancel, onConfirm }: Omit<Props, 'open'>) {
  const { t } = useTranslation()
  const [message, setMessage] = React.useState(initialMessage)

  return (
    <>
      <DialogTitle>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <CheckCircleOutlineIcon sx={{ color: 'success.main' }} />
          <span>{t('triage.closeConfirmTitle')}</span>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <DialogContentText>{t('triage.closeConfirmMessage')}</DialogContentText>
        <TextField
          fullWidth
          multiline
          minRows={3}
          autoFocus
          label={t('triage.patientMessage')}
          placeholder={t('triage.closeMessagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, PATIENT_MESSAGE_MAX))}
          slotProps={{
            htmlInput: { maxLength: PATIENT_MESSAGE_MAX },
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                  <SendIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Typography sx={{ fontSize: 12, color: tokens.textSecondary, textAlign: 'right' }}>
          {message.length}/{PATIENT_MESSAGE_MAX}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button
          variant="contained"
          disableElevation
          startIcon={message.trim() ? <SendIcon /> : <CheckCircleOutlineIcon />}
          onClick={() => onConfirm(message)}
        >
          {message.trim() ? t('triage.closeWithMessage') : confirmLabel}
        </Button>
      </DialogActions>
    </>
  )
}
