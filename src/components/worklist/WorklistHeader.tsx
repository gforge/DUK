import { Chip, Stack, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface WorklistHeaderProps {
  activeCount: number
  monitoringCount: number
  completedCount: number
  pulseCount: boolean
  pulseCompletedCount: boolean
}

export default function WorklistHeader({
  activeCount,
  monitoringCount,
  completedCount,
  pulseCount,
  pulseCompletedCount,
}: WorklistHeaderProps) {
  const { t } = useTranslation()

  return (
    <>
      <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
        <Typography variant="h5" fontWeight={700}>
          {t('worklist.title')}
        </Typography>
        <Chip
          label={activeCount}
          color="primary"
          sx={
            pulseCount
              ? {
                  animation: 'worklistPulse 0.5s ease-in-out',
                  '@keyframes worklistPulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.14)' },
                    '100%': { transform: 'scale(1)' },
                  },
                }
              : undefined
          }
        />
      </Stack>
      <Stack direction="row" gap={1} mb={0.75} flexWrap="wrap">
        <Chip
          label={`${t('worklist.activeLabel')} (${activeCount})`}
          size="small"
          color="primary"
        />
        {monitoringCount > 0 && (
          <Chip label={`${t('worklist.monitoringLabel')} (${monitoringCount})`} size="small" />
        )}
        <Chip
          label={`${t('worklist.completedLabel')} (${completedCount})`}
          size="small"
          sx={
            pulseCompletedCount
              ? {
                  animation: 'worklistPulse 0.5s ease-in-out',
                }
              : undefined
          }
        />
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {t('worklist.subtitle')}
      </Typography>
    </>
  )
}
