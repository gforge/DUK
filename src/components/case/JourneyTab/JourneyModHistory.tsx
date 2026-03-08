import AddIcon from '@mui/icons-material/Add'
import CancelIcon from '@mui/icons-material/Cancel'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { Box, Divider, Paper, Stack, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { JourneyModification, JourneyTemplate } from '@/api/schemas'

const MOD_ICON: Record<string, React.ReactNode> = {
  ADD_STEP: <AddIcon fontSize="small" />,
  REMOVE_STEP: <RemoveCircleOutlineIcon fontSize="small" />,
  SWITCH_TEMPLATE: <SwapHorizIcon fontSize="small" />,
  CANCEL: <CancelIcon fontSize="small" color="error" />,
}

interface Props {
  readonly modifications: JourneyModification[]
  readonly journeyTemplates?: JourneyTemplate[] | null
}

export default function JourneyModHistory({ modifications, journeyTemplates }: Props) {
  const { t } = useTranslation()

  if (modifications.length === 0) return null

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} mb={1}>
        {t('journey.modificationHistory')}
      </Typography>
      <Stack gap={1}>
        {modifications.map((mod) => (
          <Paper key={mod.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
              {MOD_ICON[mod.type]}
              <Typography variant="caption" fontWeight={700}>
                {t(`journey.modType.${mod.type}`)}
              </Typography>
              <Typography variant="caption" color="text.secondary" ml="auto">
                {new Date(mod.addedAt).toLocaleDateString()}
              </Typography>
            </Stack>
            <Divider sx={{ my: 0.5 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {mod.reason}
            </Typography>
            {mod.entry && (
              <Typography variant="caption" display="block">
                {t('journey.step')}: {mod.entry.label} (Day {mod.entry.offsetDays})
              </Typography>
            )}
            {mod.newTemplateId && (
              <Typography variant="caption" display="block">
                {t('journey.modify.newTemplate')}:{' '}
                {journeyTemplates?.find((jt) => jt.id === mod.newTemplateId)?.name ??
                  mod.newTemplateId}
              </Typography>
            )}
            {mod.newStartDate && (
              <Typography variant="caption" display="block" color="warning.main" fontWeight={600}>
                {t('journey.modify.dateReset')}: {mod.previousStartDate} → {mod.newStartDate}
              </Typography>
            )}
          </Paper>
        ))}
      </Stack>
    </Box>
  )
}
