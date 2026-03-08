import BiotechIcon from '@mui/icons-material/Biotech'
import ImageIcon from '@mui/icons-material/Image'
import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { ReviewTypeKey } from './JourneyTimeline/types'

export interface AddReviewDialogProps {
  open: boolean
  reviewDialog: { stepId: string; stepLabel: string; reviewType: ReviewTypeKey } | null
  description: string
  setDescription: (d: string) => void
  submitting: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function AddReviewDialog({
  open,
  reviewDialog,
  description,
  setDescription,
  submitting,
  onConfirm,
  onClose,
}: AddReviewDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('review.addReview')}</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          {reviewDialog && (
            <Chip
              icon={reviewDialog.reviewType === 'LAB' ? <BiotechIcon /> : <ImageIcon />}
              label={t(`reviewType.${reviewDialog.reviewType}` as any) as string}
              color="info"
              sx={{ alignSelf: 'flex-start' }}
            />
          )}
          <TextField
            fullWidth
            size="small"
            autoFocus
            label={t('review.description')}
            placeholder={
              reviewDialog?.reviewType === 'LAB'
                ? t('review.descriptionPlaceholderLAB')
                : t('review.descriptionPlaceholderXRAY')
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void onConfirm()
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={() => void onConfirm()} disabled={submitting}>
          {submitting ? <CircularProgress size={20} /> : t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
