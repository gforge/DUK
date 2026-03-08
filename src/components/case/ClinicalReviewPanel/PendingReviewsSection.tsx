import DeleteIcon from '@mui/icons-material/Delete'
import PendingIcon from '@mui/icons-material/Pending'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { ClinicalReview, User } from '@/api/schemas'
import { RoleIcon } from '@/components/common'
import { useReviewTypeLabel } from '@/hooks/labels'

interface Props {
  reviews: ClinicalReview[]
  userMap: Map<string, User>
  isClinician: boolean
  currentUserRole: string
  loadingReviewId: string | null
  onMarkReviewed: (id: string) => void
  onDelete: (id: string) => void
}

export function PendingReviewsSection({
  reviews,
  userMap,
  isClinician,
  currentUserRole,
  loadingReviewId,
  onMarkReviewed,
  onDelete,
}: Props) {
  const { t } = useTranslation()
  const getReviewTypeLabel = useReviewTypeLabel()

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
                      label={getReviewTypeLabel(review.type)}
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
                    <Stack direction="row" gap={0.5} alignItems="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onMarkReviewed(review.id)}
                        sx={{ height: 30, px: 1.5, textTransform: 'none' }}
                      >
                        {t('review.markReviewed')}
                      </Button>
                      {currentUserRole !== 'PATIENT' && (
                        <Tooltip title={t('common.delete')}>
                          <span>
                            <Button
                              aria-label={t('common.delete')}
                              size="small"
                              variant="text"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => onDelete(review.id)}
                              disabled={loadingReviewId === review.id}
                              sx={{ height: 30, minWidth: 40, px: 0.5 }}
                            >
                              {loadingReviewId === review.id ? (
                                <CircularProgress size={16} />
                              ) : null}
                            </Button>
                          </span>
                        </Tooltip>
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
