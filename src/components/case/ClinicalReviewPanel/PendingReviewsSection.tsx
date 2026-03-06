import React from 'react'
import { Box, Stack, Typography, Chip, Button, Alert, CircularProgress } from '@mui/material'
import PendingIcon from '@mui/icons-material/Pending'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
import { RoleIcon } from '../../common/RoleIcon'
import type { ClinicalReview, User } from '@/api/schemas'

interface Props {
  reviews: ClinicalReview[]
  userMap: Map<string, User>
  isClinician: boolean
  currentUserRole: string
  loadingReviewId: string | null
  onMarkReviewed: (id: string) => void
  onDelete: (id: string) => void
}

export default function PendingReviewsSection({
  reviews,
  userMap,
  isClinician,
  currentUserRole,
  loadingReviewId,
  onMarkReviewed,
  onDelete,
}: Props) {
  const { t } = useTranslation()

  if (reviews.length === 0) return null

  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="info" sx={{ mb: 2 }} icon={<PendingIcon />}>
        <Stack gap={1.5}>
          <Typography variant="body2" fontWeight={600}>
            {t('review.pending')} ({reviews.length})
          </Typography>
          <Stack gap={1}>
            {reviews.map((review) => (
              <Box
                key={review.id}
                sx={{
                  p: 1.5,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="start" gap={1}>
                  <Box>
                    <Chip
                      label={t(`reviewType.${review.type}`)}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 0.5 }}
                    />
                    {review.journeyStepLabel && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 0.25 }}
                      >
                        {t('review.visit')}: <strong>{review.journeyStepLabel}</strong>
                      </Typography>
                    )}
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <RoleIcon role={review.createdByRole} sx={{ fontSize: 16 }} />
                      <Typography variant="caption" color="text.secondary">
                        {userMap.get(review.createdByUserId)?.name ?? review.createdByUserId}
                      </Typography>
                    </Stack>
                  </Box>
                  {isClinician && (
                    <Stack direction="row" gap={0.5}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => onMarkReviewed(review.id)}
                      >
                        {t('review.markReviewed')}
                      </Button>
                      {currentUserRole !== 'PATIENT' && (
                        <Button
                          size="small"
                          variant="text"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => onDelete(review.id)}
                          disabled={loadingReviewId === review.id}
                        >
                          {loadingReviewId === review.id ? <CircularProgress size={16} /> : null}
                        </Button>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Alert>
    </Box>
  )
}
