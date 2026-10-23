import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { User } from '@/api/schemas'
import { useRoleLabel } from '@/hooks/labels'

interface Props {
  readonly open: boolean
  readonly colleagues: readonly User[]
  readonly onCancel: () => void
  readonly onSubmit: (reviewerUserId: string, question: string) => Promise<void>
}

/** Pick a colleague and optionally ask a question. */
export default function RequestDialog({ open, colleagues, onCancel, onSubmit }: Props) {
  const { t } = useTranslation()
  const getRoleLabel = useRoleLabel()
  const [reviewer, setReviewer] = React.useState('')
  const [question, setQuestion] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  function close() {
    setReviewer('')
    setQuestion('')
    onCancel()
  }

  async function send() {
    setBusy(true)
    try {
      await onSubmit(reviewer, question)
      setReviewer('')
      setQuestion('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      sx={{ maxWidth: 'sm' }}
      aria-labelledby="colleague-review-title"
    >
      <DialogTitle id="colleague-review-title">
        {t('triage.colleagueReview.dialogTitle')}
      </DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 2, pt: 1 }}>
          {colleagues.length === 0 ? (
            <Typography color="text.secondary">
              {t('triage.colleagueReview.noColleagues')}
            </Typography>
          ) : (
            <TextField
              select
              required
              label={t('triage.colleagueReview.colleague')}
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
            >
              {colleagues.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name} · {getRoleLabel(u.role)}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            multiline
            minRows={3}
            label={t('triage.colleagueReview.question')}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Typography variant="caption" color="text.secondary">
            {t('triage.colleagueReview.advisory')}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>{t('common.cancel')}</Button>
        <Button
          variant="contained"
          disabled={!reviewer || busy}
          onClick={() => void send()}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {t('triage.colleagueReview.send')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
