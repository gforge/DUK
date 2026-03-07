import React from 'react'
import { Button, Chip, CircularProgress, Stack, Tooltip, Typography } from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'
import EditIcon from '@mui/icons-material/Edit'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RouteIcon from '@mui/icons-material/Route'
import { useTranslation } from 'react-i18next'
import { useJourneyStatusLabel } from '@/hooks/labels'
import type { JourneyTemplate, PatientJourney } from '@/api/schemas'

function journeyStatusColor(status: string): 'primary' | 'warning' | 'default' {
  if (status === 'ACTIVE') return 'primary'
  if (status === 'SUSPENDED') return 'warning'
  return 'default'
}

interface JourneyHeaderProps {
  readonly journey: PatientJourney
  readonly template: JourneyTemplate | undefined
  readonly showStatusChip: boolean
  readonly pauseLoading: boolean
  readonly onPauseClick: () => void
  readonly onModifyClick: () => void
  readonly onResume: () => void
  readonly onCancelClick: () => void
}

export default function JourneyHeader({
  journey,
  template,
  showStatusChip,
  pauseLoading,
  onPauseClick,
  onModifyClick,
  onResume,
  onCancelClick,
}: JourneyHeaderProps) {
  const { t } = useTranslation()
  const getJourneyStatusLabel = useJourneyStatusLabel()

  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
      <Stack gap={0.5}>
        <Stack direction="row" alignItems="center" gap={1}>
          <RouteIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>
            {template?.name ?? journey.journeyTemplateId}
          </Typography>
          {showStatusChip && (
            <Chip
              label={getJourneyStatusLabel(journey.status)}
              size="small"
              color={journeyStatusColor(journey.status)}
              variant="outlined"
            />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {t('journey.startDate')}: {journey.startDate}
          {journey.totalPausedDays > 0 &&
            ` · ${t('journey.pausedDaysShort', { days: journey.totalPausedDays })}`}
        </Typography>
      </Stack>

      <Stack direction="row" gap={1}>
        {journey.status === 'ACTIVE' && (
          <>
            <Tooltip title={t('journey.pause')}>
              <Button
                startIcon={pauseLoading ? <CircularProgress size={14} /> : <PauseIcon />}
                size="small"
                variant="outlined"
                color="warning"
                onClick={onPauseClick}
                disabled={pauseLoading}
              >
                {t('journey.pause')}
              </Button>
            </Tooltip>
            <Button
              startIcon={<EditIcon />}
              size="small"
              variant="outlined"
              onClick={onModifyClick}
            >
              {t('journey.modify.action')}
            </Button>
          </>
        )}
        {journey.status === 'SUSPENDED' && (
          <Button
            startIcon={pauseLoading ? <CircularProgress size={14} /> : <PlayArrowIcon />}
            size="small"
            variant="outlined"
            color="success"
            onClick={onResume}
            disabled={pauseLoading}
          >
            {t('journey.resume')}
          </Button>
        )}
        {(journey.status === 'ACTIVE' || journey.status === 'SUSPENDED') && (
          <Tooltip title={t('journey.cancel')}>
            <Button
              startIcon={<CancelIcon />}
              size="small"
              variant="outlined"
              color="error"
              onClick={onCancelClick}
            >
              {t('journey.cancel')}
            </Button>
          </Tooltip>
        )}
      </Stack>
    </Stack>
  )
}
