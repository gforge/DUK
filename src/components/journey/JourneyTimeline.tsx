import React, { useState } from 'react'
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import ErrorIcon from '@mui/icons-material/Error'
import ScienceIcon from '@mui/icons-material/Science'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import RepeatIcon from '@mui/icons-material/Repeat'
import { useTranslation } from 'react-i18next'
import type { EffectiveStep } from '../../api/service'
import type { FormResponse } from '../../api/schemas'

type StepStatus = 'SUBMITTED' | 'UPCOMING' | 'OVERDUE'

function getStepStatus(step: EffectiveStep, responses: FormResponse[]): StepStatus {
  const submitted = responses.some((r) => r.templateId === step.templateId)
  if (submitted) return 'SUBMITTED'
  const today = new Date().toISOString().slice(0, 10)
  if (step.scheduledDate < today) return 'OVERDUE'
  return 'UPCOMING'
}

interface JourneyTimelineProps {
  steps: EffectiveStep[]
  formResponses: FormResponse[]
  /** Pass the name of the journey template for subtitle */
  journeyName?: string
}

export default function JourneyTimeline({
  steps,
  formResponses,
  journeyName,
}: JourneyTimelineProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [expandedInstructions, setExpandedInstructions] = useState<Set<string>>(new Set())

  const toggleInstruction = (id: string) => {
    setExpandedInstructions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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

  const StatusIcon = ({ status }: { status: StepStatus }) => {
    if (status === 'SUBMITTED') return <CheckCircleIcon sx={{ color: statusColor.SUBMITTED }} />
    if (status === 'OVERDUE') return <ErrorIcon sx={{ color: statusColor.OVERDUE }} />
    return <RadioButtonUncheckedIcon sx={{ color: statusColor.UPCOMING }} />
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
    </Box>
  )
}
