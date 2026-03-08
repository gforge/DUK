import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import type { ReviewType } from '@/api/schemas'

interface Props {
  open: boolean
  onClose: () => void
  reviewType: ReviewType
  setReviewType: (type: ReviewType) => void
  loading: boolean
  onConfirm: () => void
}

export function AddReviewDialog({
  open,
  onClose,
  reviewType,
  setReviewType,
  loading,
  onConfirm,
}: Props) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('review.addReview')}</DialogTitle>
      <DialogContent sx={{ minWidth: 400, pt: 2 }}>
        <FormControl fullWidth>
          <InputLabel>{t('review.type')}</InputLabel>
          <Select
            value={reviewType}
            label={t('review.type')}
            onChange={(e) => setReviewType(e.target.value as ReviewType)}
          >
            <MenuItem value="LAB">{t('reviewType.LAB')}</MenuItem>
            <MenuItem value="XRAY">{t('reviewType.XRAY')}</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={onConfirm} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
