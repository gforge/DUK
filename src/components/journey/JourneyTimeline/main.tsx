import { Box, Typography, useTheme } from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ClinicalReview, FormResponse } from '@/api/schemas'
import type { EffectiveStep } from '@/api/service'
import AddReviewDialog from '@/components/journey/AddReviewDialog'
import { ReviewDetailsDialog } from '@/components/journey/ConsentDialog/ReviewDetails'
import JourneyTimelineItem from '@/components/journey/JourneyTimelineItem'

import { getStepStatus } from './getStepStatus'
import { ReviewTypeKey, StepStatus } from './types'

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

export function JourneyTimeline({
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

  // Remove a locally-added review entry when upstream removal succeeds.
  const handleRemoveChip = async (reviewId: string) => {
    if (!onRemoveReview) return
    await onRemoveReview(reviewId)
    setAddedReviews((prev) => {
      const next = new Map(prev)
      for (const [k, v] of next.entries()) {
        if (v.reviewId === reviewId) {
          next.delete(k)
          break
        }
      }
      return next
    })
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

  if (steps.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('journey.noSteps')}
      </Typography>
    )
  }

  const _statusColor: Record<StepStatus, string> = {
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
              onRemoveReview={handleRemoveChip}
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
