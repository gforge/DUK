import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import { Chip, Skeleton, Stack, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { EpisodeOfCare, EpisodeOfCareStatus } from '@/api/schemas'
import { useEpisodeStatusLabel } from '@/hooks/labels'

function episodeStatusColor(status: EpisodeOfCareStatus): 'success' | 'default' | 'secondary' {
  if (status === 'OPEN') return 'success'
  if (status === 'DISCHARGED') return 'secondary'
  return 'default'
}

interface Props {
  readonly episode: EpisodeOfCare | undefined | null
  readonly loading?: boolean
}

export default function EpisodeHeader({ episode, loading }: Props) {
  const { t } = useTranslation()
  const episodeStatusLabel = useEpisodeStatusLabel()

  if (loading) {
    return (
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <Skeleton variant="circular" width={18} height={18} />
        <Skeleton variant="text" width={160} />
      </Stack>
    )
  }

  if (!episode) return null

  return (
    <Stack direction="row" alignItems="center" gap={1} mb={1}>
      <FolderOpenIcon fontSize="small" color="action" />
      <Typography variant="body2" fontWeight={600}>
        {episode.label}
      </Typography>
      {episode.clinicalArea && (
        <Typography variant="body2" color="text.secondary">
          · {episode.clinicalArea}
        </Typography>
      )}
      <Chip
        label={episodeStatusLabel(episode.status)}
        size="small"
        color={episodeStatusColor(episode.status)}
        variant="outlined"
      />
      <Typography variant="caption" color="text.secondary">
        {t('episode.openedAt')}: {episode.openedAt}
      </Typography>
    </Stack>
  )
}
