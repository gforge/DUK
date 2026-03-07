import React from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Chip,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useTranslation } from 'react-i18next'
import { useReviewTypeLabel, useReviewOutcomeLabel } from '@/hooks/labels'
import { RoleIcon } from '../../common/RoleIcon'
import type { ClinicalReview, User } from '@/api/schemas'

function outcomeColor(
  outcome: ClinicalReview['outcome'] | undefined,
): 'success' | 'warning' | 'error' | 'default' {
  if (outcome === 'OK') return 'success'
  if (outcome === 'UNCERTAIN') return 'warning'
  if (outcome === 'PROBLEM') return 'error'
  return 'default'
}

interface Props {
  reviews: ClinicalReview[]
  userMap: Map<string, User>
}

export default function CompletedReviewsTable({ reviews, userMap }: Props) {
  const { t } = useTranslation()
  const getReviewTypeLabel = useReviewTypeLabel()
  const getReviewOutcomeLabel = useReviewOutcomeLabel()

  if (reviews.length === 0) return null

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {t('review.completed')} ({reviews.length})
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('review.type')}</TableCell>
              <TableCell>{t('review.visit')}</TableCell>
              <TableCell>{t('review.outcome')}</TableCell>
              <TableCell>{t('review.reviewedBy')}</TableCell>
              <TableCell>{t('review.reviewedAt')}</TableCell>
              <TableCell>{t('review.note')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <Stack direction="row" gap={1} alignItems="center">
                    <CheckCircleIcon fontSize="small" color="success" />
                    <Chip label={getReviewTypeLabel(review.type)} size="small" />
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{review.journeyStepLabel ?? '-'}</Typography>
                </TableCell>
                <TableCell>
                  {review.outcome ? (
                    <Chip
                      label={getReviewOutcomeLabel(review.outcome)}
                      size="small"
                      color={outcomeColor(review.outcome)}
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {review.reviewedByUserId && review.reviewedByRole ? (
                    <Stack direction="row" gap={0.5} alignItems="center">
                      <RoleIcon role={review.reviewedByRole} sx={{ fontSize: 16 }} />
                      <Typography variant="body2">
                        {userMap.get(review.reviewedByUserId)?.name ?? review.reviewedByUserId}
                      </Typography>
                    </Stack>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {review.reviewedAt ? new Date(review.reviewedAt).toLocaleString() : '-'}
                </TableCell>
                <TableCell>{review.note || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
