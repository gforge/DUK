import BiotechIcon from '@mui/icons-material/Biotech'
import ImageIcon from '@mui/icons-material/Image'
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { ClinicalReview } from '@/api/schemas'

export interface ReviewDetailsDialogProps {
  reviewDetails: ClinicalReview | null
  onClose: () => void
}

export function ReviewDetailsDialog({ reviewDetails, onClose }: ReviewDetailsDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={!!reviewDetails} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {reviewDetails ? t(`reviewType.${reviewDetails.type}`) : t('review.type')}
      </DialogTitle>
      <DialogContent>
        {reviewDetails && (
          <Stack gap={1.25} sx={{ pt: 1 }}>
            <Chip
              size="small"
              icon={reviewDetails.type === 'LAB' ? <BiotechIcon /> : <ImageIcon />}
              label={t(`reviewType.${reviewDetails.type}`)}
            />
            <Typography variant="caption" color="text.secondary">
              {reviewDetails.reviewedAt
                ? t('review.reviewedAt', {
                    date: new Date(reviewDetails.reviewedAt).toLocaleDateString(),
                  })
                : t('review.pending')}
            </Typography>
            {reviewDetails.note && <Typography>{reviewDetails.note}</Typography>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  )
}
