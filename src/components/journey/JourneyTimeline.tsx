import React, { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import ErrorIcon from '@mui/icons-material/Error'
import ScienceIcon from '@mui/icons-material/Science'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import RepeatIcon from '@mui/icons-material/Repeat'
import BiotechIcon from '@mui/icons-material/Biotech'
import ImageIcon from '@mui/icons-material/Image'
import { useTranslation } from 'react-i18next'
import type { EffectiveStep } from '@/api/service'
import type { FormResponse } from '@/api/schemas'

type StepStatus = 'SUBMITTED' | 'UPCOMING' | 'OVERDUE'

function getStepStatus(step: EffectiveStep, responses: FormResponse[]): StepStatus {
  const submitted = responses.some((r) => r.templateId === step.templateId)
  if (submitted) return 'SUBMITTED'
  const today = new Date().toISOString().slice(0, 10)
  if (step.scheduledDate < today) return 'OVERDUE'
  return 'UPCOMING'
}

interface StatusIconProps {
  readonly status: StepStatus
}

const StatusIcon = ({ status }: StatusIconProps) => {
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

const REVIEW_TYPES = ['LAB', 'XRAY'] as const
type ReviewTypeKey = (typeof REVIEW_TYPES)[number]

interface JourneyTimelineProps {
  readonly steps: EffectiveStep[]
  readonly formResponses: FormResponse[]
  /** Pass the name of the journey template for subtitle */
  readonly journeyName?: string
  /** When provided review chips are interactive; without it they are shown disabled. */
  readonly onAddReview?: (
    stepId: string,
    reviewType: string,
    description?: string,
    stepLabel?: string,
  ) => Promise<string>
  /** When provided filled chips can be clicked to cancel/remove the review. */
  readonly onRemoveReview?: (reviewId: string) => Promise<void>
}

export default function JourneyTimeline({
  steps,
  formResponses,
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
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Track reviews added this session so chips turn filled immediately (key → { reviewId, description })
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
            <Box key={step.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              {/* Left column: icon + connector line */}
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
                      bgcolor:
                        status === 'SUBMITTED'
                          ? theme.palette.success.light
                          : theme.palette.divider,
                      my: 0.5,
                    }}
                  />
                )}
              </Box>

              {/* Right column: content */}
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
                    label={t(`journey.status.${status}`)}
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
                  {t('journey.scheduledDate')}: {step.scheduledDate}
                  {step.windowDays > 0 && ` ±${step.windowDays}d`}
                </Typography>

                {/* Review chips — always visible on non-submitted steps */}
                {status !== 'SUBMITTED' && (
                  <Stack direction="row" gap={0.5} sx={{ mt: 0.5 }} flexWrap="wrap">
                    {REVIEW_TYPES.map((reviewType) => {
                      const key = `${step.id}:${reviewType}`
                      const addedEntry = addedReviews.get(key)
                      const isAdded = !!addedEntry
                      const isExpected = step.reviewTypes?.includes(reviewType)
                      const canAdd = !!onAddReview && !isAdded
                      const canRemove = isAdded && !!onRemoveReview
                      const disabled = !canAdd && !canRemove
                      let tooltipTitle: string
                      if (isAdded && canRemove) {
                        tooltipTitle =
                          t('review.remove') +
                          (addedEntry.description ? `: ${addedEntry.description}` : '')
                      } else if (isAdded) {
                        tooltipTitle = addedEntry.description ?? t(`reviewType.${reviewType}`)
                      } else if (onAddReview) {
                        tooltipTitle = isExpected
                          ? t('review.expectedAtThisStep')
                          : t('review.addReview')
                      } else {
                        tooltipTitle = t('review.notAvailableHere')
                      }
                      const chipLabel =
                        isAdded && addedEntry.description
                          ? t(`reviewType.${reviewType}`) + ': ' + addedEntry.description
                          : t(`reviewType.${reviewType}`)
                      const handleClick =
                        canRemove && addedEntry
                          ? () => void handleRemoveChip(key, addedEntry.reviewId)
                          : canAdd
                            ? () => openDialog(step.id, reviewType, step.label)
                            : undefined
                      return (
                        <Tooltip key={reviewType} title={tooltipTitle}>
                          {/* span needed so Tooltip works on disabled Chip */}
                          <span>
                            <Chip
                              icon={
                                reviewType === 'LAB' ? (
                                  <BiotechIcon fontSize="small" />
                                ) : (
                                  <ImageIcon fontSize="small" />
                                )
                              }
                              label={chipLabel}
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
                    })}
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
        })}
      </Box>

      {/* Add-review description dialog */}
      <Dialog open={!!reviewDialog} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('review.addReview')}</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            {reviewDialog && (
              <Chip
                icon={reviewDialog.reviewType === 'LAB' ? <BiotechIcon /> : <ImageIcon />}
                label={t(`reviewType.${reviewDialog.reviewType}`)}
                color="info"
                sx={{ alignSelf: 'flex-start' }}
              />
            )}
            <TextField
              fullWidth
              size="small"
              autoFocus
              label={t('review.description')}
              placeholder={
                reviewDialog?.reviewType === 'LAB'
                  ? t('review.descriptionPlaceholderLAB')
                  : t('review.descriptionPlaceholderXRAY')
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleConfirmAdd()
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={() => void handleConfirmAdd()} disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
