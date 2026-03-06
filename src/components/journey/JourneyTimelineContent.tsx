import React, { useState } from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { useTranslation } from 'react-i18next'
import type { EffectiveStep } from '@/api/service'
import type { ClinicalReview, FormResponse } from '@/api/schemas'
import JourneyTimelineItem from './JourneyTimelineItem'
import AddReviewDialog from './AddReviewDialog'
import ReviewDetailsDialog from './ReviewDetailsDialog'

export type StepStatus = 'SUBMITTED' | 'UPCOMING' | 'OVERDUE'

export const REVIEW_TYPES = ['LAB', 'XRAY'] as const
export type ReviewTypeKey = (typeof REVIEW_TYPES)[number]

export const StatusIcon = ({ status }: { status: StepStatus }) => {
  const theme = useTheme()
  const statusColor: Record<StepStatus, string> = {
    SUBMITTED: theme.palette.success.main,
    UPCOMING: theme.palette.primary.main,
    OVERDUE: theme.palette.error.main,
  }
  if (status === 'SUBMITTED') return <CheckCircleIcon sx={{ color: statusColor.SUBMITTED }} />
  if (status === 'OVERDUE') return <ErrorIcon sx={{ color: statusColor.OVERDUE }} />
  return <RadioButtonUncheckedIcon sx={{ color: statusColor.UPCOMING }} />
}

function getStepStatus(step: EffectiveStep, responses: FormResponse[]): StepStatus {
  const submitted = responses.some((r) => r.templateId === step.templateId)
  if (submitted) return 'SUBMITTED'
  const today = new Date().toISOString().slice(0, 10)
  if (step.scheduledDate < today) return 'OVERDUE'
  return 'UPCOMING'
}

interface JourneyTimelineProps {
  readonly steps: EffectiveStep[]
  readonly formResponses: FormResponse[]
  readonly reviews?: ClinicalReview[]
  readonly journeyName?: string
  readonly onAddReview?: (
    stepId: string,
    reviewType: string,
    description?: string,
    stepLabel?: string,
  ) => Promise<string>
  readonly onRemoveReview?: (reviewId: string) => Promise<void>
}

export default function JourneyTimeline({
  steps,
  formResponses,
  reviews = [],
  journeyName,
  onAddReview,
  onRemoveReview,
}: Readonly<JourneyTimelineProps>) {
  const { t } = useTranslation()
  const theme = useTheme()

  const [expandedInstructions, setExpandedInstructions] = useState<Set<string>>(new Set())
  const [reviewDialog, setReviewDialog] = useState<{
    stepId: string
    stepLabel: string
    reviewType: ReviewTypeKey
  } | null>(null)
  const [reviewDetails, setReviewDetails] = useState<ClinicalReview | null>(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addedReviews, setAddedReviews] = useState<
    Map<string, { reviewId: string; description?: string }>
  >(new Map())

  const toggleInstruction = (id: string) => {
    setExpandedInstructions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openDialog = (stepId: string, reviewType: ReviewTypeKey, stepLabel: string) => {
    setDescription('')
    setReviewDialog({ stepId, stepLabel, reviewType })
  }

  const closeDialog = () => {
    setReviewDialog(null)
    setDescription('')
  }

  const getStepReview = (stepLabel: string, reviewType: ReviewTypeKey): ClinicalReview | null => {
    const candidates = reviews.filter(
      (review) => review.type === reviewType && review.journeyStepLabel === stepLabel,
    )
    if (candidates.length === 0) return null
    return [...candidates].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]
  }

  const handleConfirmAdd = async () => {
    if (!reviewDialog || !onAddReview) return
    setSubmitting(true)
    try {
      const reviewId = await onAddReview(
        reviewDialog.stepId,
        reviewDialog.reviewType,
        description || undefined,
        reviewDialog.stepLabel,
      )
      const key = `${reviewDialog.stepId}:${reviewDialog.reviewType}`
      setAddedReviews((prev) => {
        const next = new Map(prev)
        next.set(key, { reviewId, description: description.trim() || undefined })
        return next
      })
      closeDialog()
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveChip = async (key: string, reviewId: string) => {
    if (!onRemoveReview) return
    await onRemoveReview(reviewId)
    setAddedReviews((prev) => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }

  if (steps.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('journey.noSteps')}
      </Typography>
    )
  }

  const statusColor: Record<StepStatus, string> = {
    SUBMITTED: theme.palette.success.main,
    UPCOMING: theme.palette.primary.main,
    OVERDUE: theme.palette.error.main,
  }

  return (
    <Box>
      {journeyName && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {journeyName}
        </Typography>
      )}
      <Box sx={{ position: 'relative' }}>
        {steps.map((step, idx) => {
          const status = getStepStatus(step, formResponses)
          const isLast = idx === steps.length - 1
          return (
            <JourneyTimelineItem
              key={step.id}
              step={step}
              status={status}
              isLast={isLast}
              reviews={reviews}
              addedReviews={addedReviews}
              onAddReview={onAddReview}
              onRemoveReview={onRemoveReview}
              setReviewDetails={setReviewDetails}
              expandedInstructions={expandedInstructions}
              toggleInstruction={toggleInstruction}
              openDialog={openDialog}
            />
          )
        })}
      </Box>

      <AddReviewDialog
        open={!!reviewDialog}
        reviewDialog={reviewDialog}
        description={description}
        setDescription={setDescription}
        submitting={submitting}
        onConfirm={handleConfirmAdd}
        onClose={closeDialog}
      />

      <ReviewDetailsDialog reviewDetails={reviewDetails} onClose={() => setReviewDetails(null)} />
    </Box>
  )
}
