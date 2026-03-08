import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import BiotechIcon from '@mui/icons-material/Biotech'
import ImageIcon from '@mui/icons-material/Image'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import RepeatIcon from '@mui/icons-material/Repeat'
import ScienceIcon from '@mui/icons-material/Science'
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { ClinicalReview } from '@/api/schemas'
import type { EffectiveStep } from '@/api/service'
import { type StepStatus,useStepStatusLabel } from '@/hooks/labels'

import { StatusIcon } from './JourneyTimeline/StatusIcon'
import { ReviewTypeKey } from './JourneyTimeline/types'

interface Props {
  step: EffectiveStep
  status: StepStatus
  isLast: boolean
  reviews: ClinicalReview[]
  addedReviews: Map<string, { reviewId: string; description?: string }>
  onAddReview?: (
    stepId: string,
    reviewType: string,
    description?: string,
    stepLabel?: string,
  ) => Promise<string>
  onRemoveReview?: (reviewId: string) => Promise<void>
  setReviewDetails: (r: ClinicalReview | null) => void
  expandedInstructions: Set<string>
  toggleInstruction: (id: string) => void
  openDialog: (stepId: string, reviewType: ReviewTypeKey, stepLabel: string) => void
}

export default function JourneyTimelineItem({
  step,
  status,
  isLast,
  reviews,
  addedReviews,
  onAddReview,
  onRemoveReview,
  setReviewDetails,
  expandedInstructions,
  toggleInstruction,
  openDialog,
}: Props) {
  const { t } = useTranslation()
  const getStepStatusLabel = useStepStatusLabel()
  const theme = useTheme()

  const statusColor: Record<StepStatus, string> = {
    SUBMITTED: theme.palette.success.main,
    UPCOMING: theme.palette.primary.main,
    OVERDUE: theme.palette.error.main,
  }

  const REVIEW_TYPES: ReviewTypeKey[] = ['LAB', 'XRAY']

  const reviewChip = (reviewType: ReviewTypeKey) => {
    const key = `${step.id}:${reviewType}`
    const addedEntry = addedReviews.get(key)
    const addedDescription = addedEntry?.description
    const existingReview =
      reviews
        .filter((r) => r.type === reviewType && r.journeyStepLabel === step.label)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ||
      null
    const isAdded = !!addedEntry || !!existingReview
    const isExpected = step.reviewTypes?.includes(reviewType)
    const canAdd = !!onAddReview && !isAdded
    const canRemove = !!addedEntry && !!onRemoveReview
    const canView = !!existingReview
    const disabled = !canAdd && !canRemove && !canView
    let tooltipTitle: string
    if (isAdded && canRemove) {
      tooltipTitle = t('review.remove') + (addedDescription ? `: ${addedDescription}` : '')
    } else if (canView && existingReview) {
      tooltipTitle =
        existingReview.reviewedAt !== null
          ? t('review.reviewedAt', {
              date: new Date(existingReview.reviewedAt).toLocaleDateString(),
            })
          : t('review.pending')
    } else if (isAdded) {
      tooltipTitle = addedDescription ?? (t(`reviewType.${reviewType}` as any) as string)
    } else if (onAddReview) {
      tooltipTitle = isExpected ? t('review.expectedAtThisStep') : t('review.addReview')
    } else {
      tooltipTitle = t('review.notAvailableHere')
    }
    const chipLabel =
      isAdded && addedDescription
        ? (t(`reviewType.${reviewType}` as any) as string) + ': ' + addedDescription
        : canView && existingReview?.note
          ? (t(`reviewType.${reviewType}` as any) as string) + ': ' + existingReview.note
          : (t(`reviewType.${reviewType}` as any) as string)
    const handleClick =
      canRemove && addedEntry
        ? () => void onRemoveReview!(addedEntry.reviewId)
        : canView && existingReview
          ? () => setReviewDetails(existingReview)
          : canAdd
            ? () => openDialog(step.id, reviewType, step.label)
            : undefined
    return (
      <Tooltip key={reviewType} title={tooltipTitle}>
        <span>
          <Chip
            icon={
              reviewType === 'LAB' ? (
                <BiotechIcon fontSize="small" />
              ) : (
                <ImageIcon fontSize="small" />
              )
            }
            label={chipLabel as string}
            size="small"
            color="info"
            variant={isAdded ? 'filled' : 'outlined'}
            sx={{
              height: 22,
              fontSize: 11,
              ...(isExpected && !isAdded ? { borderStyle: 'dashed' } : {}),
            }}
            disabled={disabled}
            onClick={handleClick}
          />
        </span>
      </Tooltip>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      {/* left column */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ mt: 0.25 }}>
          <StatusIcon status={status} />
        </Box>
        {!isLast && (
          <Box
            sx={{
              width: 2,
              flex: 1,
              minHeight: 24,
              bgcolor: status === 'SUBMITTED' ? theme.palette.success.light : theme.palette.divider,
              my: 0.5,
            }}
          />
        )}
      </Box>

      {/* right column */}
      <Box sx={{ pb: isLast ? 0 : 2, flex: 1 }}>
        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.5} mb={0.25}>
          <Typography variant="body2" fontWeight={600}>
            {step.label}
          </Typography>

          {step.isResearch && (
            <Tooltip title={t('journey.researchStep')}>
              <Chip
                icon={<ScienceIcon />}
                label={t('journey.researchLabel')}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ height: 20, fontSize: 11 }}
              />
            </Tooltip>
          )}

          {step.isAdded && (
            <Tooltip title={t('journey.addedStep')}>
              <Chip
                icon={<AddCircleOutlineIcon />}
                label={t('journey.added')}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ height: 20, fontSize: 11 }}
              />
            </Tooltip>
          )}

          {step.isRecurring && step.occurrenceIndex !== undefined && (
            <Tooltip title={t('journey.recurringStep')}>
              <Chip
                icon={<RepeatIcon />}
                label={t('journey.recurringOccurrence', { n: step.occurrenceIndex + 1 })}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ height: 20, fontSize: 11 }}
              />
            </Tooltip>
          )}

          <Chip
            label={getStepStatusLabel(status)}
            size="small"
            sx={{
              height: 20,
              fontSize: 11,
              bgcolor: statusColor[status] + '22',
              color: statusColor[status],
              fontWeight: 600,
            }}
          />
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {t('journey.scheduledDate' as any) as string}: {step.scheduledDate}
          {step.windowDays > 0 && ` ±${step.windowDays}d`}
        </Typography>

        {(status !== 'SUBMITTED' ||
          REVIEW_TYPES.some((rt) =>
            reviews.some((r) => r.type === rt && r.journeyStepLabel === step.label),
          )) && (
          <Stack direction="row" gap={0.5} sx={{ mt: 0.5 }} flexWrap="wrap">
            {REVIEW_TYPES.map(reviewChip)}
          </Stack>
        )}

        {step.resolvedInstruction && (
          <Box>
            <Tooltip title={t('journey.toggleInstruction')}>
              <IconButton
                size="small"
                onClick={() => toggleInstruction(step.id)}
                sx={{ ml: -0.5, mt: 0.25 }}
                aria-label={t('journey.toggleInstruction')}
              >
                <InfoOutlinedIcon
                  fontSize="small"
                  color={expandedInstructions.has(step.id) ? 'primary' : 'action'}
                />
              </IconButton>
            </Tooltip>
            <Collapse in={expandedInstructions.has(step.id)}>
              <Box
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  borderLeft: 3,
                  borderColor: 'primary.light',
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    color: 'text.secondary',
                  }}
                >
                  {step.resolvedInstruction}
                </Typography>
              </Box>
            </Collapse>
          </Box>
        )}
      </Box>
    </Box>
  )
}
