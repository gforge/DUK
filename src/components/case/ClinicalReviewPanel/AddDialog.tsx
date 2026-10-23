import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
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
    <Dialog open={open} onClose={onClose} aria-labelledby="add-review-title">
      <DialogTitle id="add-review-title">{t('review.awaitResultTitle')}</DialogTitle>
      <DialogContent sx={{ minWidth: 400 }}>
        <Typography id="add-review-type" sx={{ fontSize: 14, color: 'text.secondary', mb: 1 }}>
          {t('review.awaitResultLabel')}
        </Typography>
        <ToggleButtonGroup
          value={reviewType}
          exclusive
          fullWidth
          aria-labelledby="add-review-type"
          onChange={(_, val: ReviewType | null) => val && setReviewType(val)}
          sx={{ '& .MuiToggleButton-root': { textTransform: 'none', gap: 1, py: 1.25 } }}
        >
          <ToggleButton value="LAB" color="primary">
            <BiotechOutlinedIcon fontSize="small" />
            {t('reviewType.LAB')}
          </ToggleButton>
          <ToggleButton value="XRAY" color="primary">
            <ImageOutlinedIcon fontSize="small" />
            {t('reviewType.XRAY')}
          </ToggleButton>
        </ToggleButtonGroup>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 1.5 }}>
          {t('review.awaitResultHelp')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={onConfirm} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : t('review.awaitResultConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
