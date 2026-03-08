import CancelIcon from '@mui/icons-material/Cancel'
import EditIcon from '@mui/icons-material/Edit'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { Button, CircularProgress, Stack, Tooltip } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { PatientJourney } from '@/api/schemas'
import { useRole } from '@/store/roleContext'

interface Props {
  readonly journey: PatientJourney
  readonly pauseLoading: boolean
  readonly onPauseClick: () => void
  readonly onResume: () => void
  readonly onModifyClick: () => void
  readonly onCancelClick: () => void
}

export function JourneyPanelActions({
  journey,
  pauseLoading,
  onPauseClick,
  onResume,
  onModifyClick,
  onCancelClick,
}: Props) {
  const { t } = useTranslation()
  const { currentUser } = useRole()

  const canEdit =
    currentUser.role === 'DOCTOR' || currentUser.role === 'PAL' || currentUser.role === 'NURSE'
  if (!canEdit) return null

  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
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
          <Button startIcon={<EditIcon />} size="small" variant="outlined" onClick={onModifyClick}>
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
        <Button
          startIcon={<CancelIcon />}
          size="small"
          variant="outlined"
          color="error"
          onClick={onCancelClick}
        >
          {t('journey.cancel')}
        </Button>
      )}
    </Stack>
  )
}
