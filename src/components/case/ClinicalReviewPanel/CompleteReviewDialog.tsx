import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { ReviewOutcome } from '@/api/schemas'

interface Props {
  open: boolean
  outcome: ReviewOutcome
  note: string
  loading: boolean
  onClose: () => void
  onChangeOutcome: (o: ReviewOutcome) => void
  onChangeNote: (n: string) => void
  onConfirm: () => void
}

export default function CompleteReviewDialog({
  open,
  outcome,
  note,
  loading,
  onClose,
  onChangeOutcome,
  onChangeNote,
  onConfirm,
}: Props) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('review.markReviewed')}</DialogTitle>
      <DialogContent sx={{ minWidth: 420, pt: 2 }}>
        <Stack gap={2.5}>
          <ToggleButtonGroup
            value={outcome}
            exclusive
            fullWidth
            onChange={(_, val: ReviewOutcome | null) => {
              if (val) {
                onChangeOutcome(val)
                onChangeNote('')
              }
            }}
          >
            <ToggleButton value="OK" color="success">
              <CheckCircleOutlineIcon sx={{ mr: 1 }} />
              {t('reviewOutcome.OK')}
            </ToggleButton>
            <ToggleButton value="UNCERTAIN" color="warning">
              <HelpOutlineIcon sx={{ mr: 1 }} />
              {t('reviewOutcome.UNCERTAIN')}
            </ToggleButton>
            <ToggleButton value="PROBLEM" color="error">
              <ReportProblemIcon sx={{ mr: 1 }} />
              {t('reviewOutcome.PROBLEM')}
            </ToggleButton>
          </ToggleButtonGroup>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={t('review.comment')}
            placeholder={t('review.commentPlaceholder')}
            value={note}
            onChange={(e) => onChangeNote(e.target.value)}
            required={outcome !== 'OK'}
            error={outcome !== 'OK' && !note.trim()}
            helperText={outcome !== 'OK' && !note.trim() ? t('review.commentRequired') : undefined}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={loading || (outcome !== 'OK' && !note.trim())}
        >
          {loading ? <CircularProgress size={24} /> : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
