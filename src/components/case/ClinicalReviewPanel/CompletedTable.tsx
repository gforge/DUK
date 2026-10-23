import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { format } from 'date-fns'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { ClinicalReview, User } from '@/api/schemas'
import { cardSx } from '@/components/case/triage/styles'
import { useDateLocale } from '@/components/case/triage/useTriageDirectory'
import { RoleIcon } from '@/components/common'
import { useReviewOutcomeLabel, useReviewTypeLabel } from '@/hooks/labels'
import { tokens } from '@/theme'

const OUTCOME_COLORS: Record<NonNullable<ClinicalReview['outcome']>, { bg: string; fg: string }> = {
  OK: { bg: tokens.successBg, fg: tokens.successFg },
  UNCERTAIN: { bg: tokens.warningBg, fg: tokens.warningFg },
  PROBLEM: { bg: tokens.errorBg, fg: tokens.errorFg },
}

interface Props {
  readonly reviews: ClinicalReview[]
  readonly userMap: Map<string, User>
  /** Rendered at the right of the card header, e.g. the "add review" button. */
  readonly action?: React.ReactNode
}

/** Card listing completed lab/X-ray reviews: one compact row per review. */
export function CompletedReviewsTable({ reviews, userMap, action }: Props) {
  const { t } = useTranslation()
  const locale = useDateLocale()
  const getReviewTypeLabel = useReviewTypeLabel()
  const getReviewOutcomeLabel = useReviewOutcomeLabel()
  if (reviews.length === 0) return null

  return (
    <Box component="section" aria-labelledby="completed-reviews-title" sx={cardSx}>
      <Stack
        direction="row"
        sx={{
          px: 2.5,
          py: 1.25,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          borderBottom: `1px solid ${tokens.rowDivider}`,
        }}
      >
        <Typography
          id="completed-reviews-title"
          component="h3"
          sx={{ fontWeight: 700, fontSize: 15 }}
        >
          {t('review.completed')} ({reviews.length})
        </Typography>
        {action}
      </Stack>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {reviews.map((review, i) => {
          const reviewer = review.reviewedByUserId
            ? (userMap.get(review.reviewedByUserId)?.name ?? review.reviewedByUserId)
            : null
          const colors = review.outcome ? OUTCOME_COLORS[review.outcome] : null
          return (
            <Box
              component="li"
              key={review.id}
              sx={{
                px: 2.5,
                py: 1.25,
                borderTop: i === 0 ? 'none' : `1px solid ${tokens.rowDivider}`,
              }}
            >
              <Stack
                direction="row"
                sx={{ alignItems: 'center', gap: 1.25, flexWrap: 'wrap', rowGap: 0.75 }}
              >
                <CheckCircleIcon sx={{ fontSize: 18, color: tokens.successFg }} />
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                  {getReviewTypeLabel(review.type)}
                </Typography>
                {review.outcome && colors && (
                  <Chip
                    label={getReviewOutcomeLabel(review.outcome)}
                    size="small"
                    sx={{ bgcolor: colors.bg, color: colors.fg, fontWeight: 600, height: 22 }}
                  />
                )}
                {review.journeyStepLabel && (
                  <Typography sx={{ fontSize: 13, color: tokens.textSecondary }}>
                    {t('review.visit')}: {review.journeyStepLabel}
                  </Typography>
                )}
                <Stack
                  direction="row"
                  sx={{ ml: 'auto', alignItems: 'center', gap: 0.75, color: tokens.textSecondary }}
                >
                  {reviewer && review.reviewedByRole && (
                    <>
                      <RoleIcon role={review.reviewedByRole} sx={{ fontSize: 16 }} />
                      <Typography sx={{ fontSize: 13, color: tokens.text2 }}>{reviewer}</Typography>
                    </>
                  )}
                  {review.reviewedAt && (
                    <Typography sx={{ fontSize: 13 }}>
                      {reviewer ? '· ' : ''}
                      {format(new Date(review.reviewedAt), 'd MMM yyyy HH:mm', { locale })}
                    </Typography>
                  )}
                </Stack>
              </Stack>
              {review.note && (
                <Typography
                  sx={{
                    mt: 0.5,
                    ml: '30px',
                    fontSize: 13,
                    color: tokens.text2,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {review.note}
                </Typography>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
