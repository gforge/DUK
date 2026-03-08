import RouteIcon from '@mui/icons-material/Route'
import { Box, Chip, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { JourneyTemplate,PatientJourney } from '@/api/schemas'

interface Props {
  readonly journeys: PatientJourney[]
  readonly journeyTemplates: JourneyTemplate[]
}

function statusColor(status: string): 'primary' | 'warning' | 'default' {
  if (status === 'ACTIVE') return 'primary'
  if (status === 'SUSPENDED') return 'warning'
  return 'default'
}

export default function JourneyChips({ journeys, journeyTemplates }: Props) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isWide = useMediaQuery(theme.breakpoints.up('md'))

  if (journeys.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        {t('patients.noJourney')}
      </Typography>
    )
  }

  // Sort: ACTIVE first, then SUSPENDED, then COMPLETED; newest first within group
  const STATUS_ORDER: Record<string, number> = { ACTIVE: 0, SUSPENDED: 1, COMPLETED: 2 }
  const sorted = [...journeys].sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const getName = (j: PatientJourney) =>
    journeyTemplates.find((jt) => jt.id === j.journeyTemplateId)?.name ?? j.journeyTemplateId

  // Wide screen AND fewer than 3 journeys → one chip per journey
  if (isWide && sorted.length < 3) {
    return (
      <Stack direction="row" gap={0.5} flexWrap="wrap">
        {sorted.map((j) => (
          <Chip
            key={j.id}
            size="small"
            icon={<RouteIcon />}
            label={getName(j)}
            color={statusColor(j.status)}
            variant="outlined"
            sx={{ fontSize: 11 }}
          />
        ))}
      </Stack>
    )
  }

  // Wide screen with 3+ journeys → first 2 chips + overflow count
  if (isWide) {
    const overflow = sorted.length - 2
    return (
      <Stack direction="row" gap={0.5} flexWrap="wrap">
        {sorted.slice(0, 2).map((j) => (
          <Chip
            key={j.id}
            size="small"
            icon={<RouteIcon />}
            label={getName(j)}
            color={statusColor(j.status)}
            variant="outlined"
            sx={{ fontSize: 11 }}
          />
        ))}
        <Chip
          key="overflow"
          size="small"
          label={`+${overflow}`}
          variant="outlined"
          sx={{ fontSize: 11 }}
        />
      </Stack>
    )
  }

  // Narrow screen → compact single chip: "Template name +N" if multiple
  const first = sorted[0]
  const overflow = sorted.length > 1 ? ' +' + String(sorted.length - 1) : ''
  const label = getName(first) + overflow
  return (
    <Box>
      <Chip
        size="small"
        icon={<RouteIcon />}
        label={label}
        color={statusColor(first.status)}
        variant="outlined"
        sx={{ fontSize: 11 }}
      />
    </Box>
  )
}
