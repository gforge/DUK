import React from 'react'
import { Box, Divider, Paper, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { useTranslation } from 'react-i18next'
import type { JourneyModification, JourneyTemplate } from '../../../api/schemas'

const MOD_ICON: Record<string, React.ReactNode> = {
  ADD_STEP: <AddIcon fontSize="small" />,
  REMOVE_STEP: <RemoveCircleOutlineIcon fontSize="small" />,
  SWITCH_TEMPLATE: <SwapHorizIcon fontSize="small" />,
}

interface Props {
  modifications: JourneyModification[]
  journeyTemplates?: JourneyTemplate[] | null
}

export default function JourneyModHistory({ modifications, journeyTemplates }: Props) {
  const { t } = useTranslation()

  if (modifications.length === 0) return null

  return (
    <Box>
      <Typography sx={{ fontWeight: 600, mb: 1 }} variant="subtitle2">
        {t('journey.modificationHistory')}
      </Typography>
      <Stack sx={{ gap: 1 }}>
        {modifications.map((mod) => (
          <Paper key={mod.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
            <Stack sx={{ alignItems: 'center', gap: 1, mb: 0.5 }} direction="row">
              {MOD_ICON[mod.type]}
              <Typography sx={{ fontWeight: 700 }} variant="caption">
                {t(`journey.modType.${mod.type}`)}
              </Typography>
              <Typography sx={{ ml: 'auto' }} variant="caption" color="text.secondary">
                {new Date(mod.addedAt).toLocaleDateString()}
              </Typography>
            </Stack>
            <Divider sx={{ my: 0.5 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {mod.reason}
            </Typography>
            {mod.entry && (
              <Typography sx={{ display: 'block' }} variant="caption">
                {t('journey.step')}: {mod.entry.label} (Day {mod.entry.offsetDays})
              </Typography>
            )}
            {mod.newTemplateId && (
              <Typography sx={{ display: 'block' }} variant="caption">
                {t('journey.modify.newTemplate')}:{' '}
                {journeyTemplates?.find((jt) => jt.id === mod.newTemplateId)?.name ??
                  mod.newTemplateId}
              </Typography>
            )}
            {mod.newStartDate && (
              <Typography
                sx={{ display: 'block', fontWeight: 600 }}
                variant="caption"
                color="warning.main"
              >
                {t('journey.modify.dateReset')}: {mod.previousStartDate} → {mod.newStartDate}
              </Typography>
            )}
          </Paper>
        ))}
      </Stack>
    </Box>
  )
}
