import CancelIcon from '@mui/icons-material/Cancel'
import EditIcon from '@mui/icons-material/Edit'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RouteIcon from '@mui/icons-material/Route'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import {
  Button,
  Chip,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { JourneyTemplate, PatientJourney } from '@/api/schemas'
import { useJourneyStatusLabel } from '@/hooks/labels'

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
  readonly onStartNextPhase?: () => void
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
  onStartNextPhase,
}: JourneyHeaderProps) {
  const { t } = useTranslation()
  const getJourneyStatusLabel = useJourneyStatusLabel()
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null)

  const isActive = journey.status === 'ACTIVE'
  const isSuspended = journey.status === 'SUSPENDED'
  const hasOverflowActions = isActive || isSuspended
  const canStartNextPhase = isActive && !!onStartNextPhase
  const showModify = isActive || isSuspended

  const closeMenu = () => setMenuAnchorEl(null)

  const handlePauseClick = () => {
    onPauseClick()
    closeMenu()
  }

  const handleCancelClick = () => {
    onCancelClick()
    closeMenu()
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'flex-start' }}
      justifyContent="space-between"
      gap={1}
      mb={1.5}
    >
      <Stack gap={0.5} sx={{ minWidth: 0 }}>
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

      <Stack
        direction="row"
        alignItems="center"
        justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
        gap={1}
        sx={{ flexWrap: 'wrap' }}
      >
        {canStartNextPhase && (
          <Button
            startIcon={<SkipNextIcon />}
            size="small"
            variant="contained"
            color="primary"
            onClick={onStartNextPhase}
          >
            {t('journey.startNextPhase')}
          </Button>
        )}

        {isSuspended && (
          <Button
            startIcon={pauseLoading ? <CircularProgress size={14} /> : <PlayArrowIcon />}
            size="small"
            variant="contained"
            color="success"
            onClick={onResume}
            disabled={pauseLoading}
          >
            {t('journey.resume')}
          </Button>
        )}

        {showModify && (
          <Button startIcon={<EditIcon />} size="small" variant="outlined" onClick={onModifyClick}>
            {t('journey.modify.action')}
          </Button>
        )}

        {hasOverflowActions && (
          <>
            <Tooltip title={t('common.moreActions')}>
              <IconButton
                size="small"
                aria-label={t('common.moreActions')}
                aria-haspopup="true"
                aria-expanded={Boolean(menuAnchorEl)}
                onClick={(event) => setMenuAnchorEl(event.currentTarget)}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={closeMenu}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {isActive && (
                <MenuItem onClick={handlePauseClick} disabled={pauseLoading}>
                  <ListItemIcon>
                    {pauseLoading ? <CircularProgress size={14} /> : <PauseIcon fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText>{t('journey.pause')}</ListItemText>
                </MenuItem>
              )}
              {(isActive || isSuspended) && (
                <MenuItem onClick={handleCancelClick} sx={{ color: 'error.main' }}>
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    <CancelIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t('journey.cancel')}</ListItemText>
                </MenuItem>
              )}
            </Menu>
          </>
        )}
      </Stack>
    </Stack>
  )
}
