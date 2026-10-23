import RouteIcon from '@mui/icons-material/Route'
import { Box } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { JourneyTemplate, PatientJourney } from '@/api/schemas'
import { Tag } from '@/components/common'
import { tokens } from '@/theme'

interface Props {
  readonly journeys: PatientJourney[]
  readonly journeyTemplates: JourneyTemplate[]
  /** Number of journey tags shown before collapsing the rest into "+N". */
  readonly max?: number
}

// ACTIVE first, then SUSPENDED, then COMPLETED; newest first within group
const STATUS_ORDER: Record<string, number> = { ACTIVE: 0, SUSPENDED: 1, COMPLETED: 2 }

/** Patient journeys as tags: active = selected (blue), paused/completed = admin (grey). */
export default function JourneyChips({ journeys, journeyTemplates, max = 2 }: Props) {
  const { t } = useTranslation()
  if (journeys.length === 0) {
    return (
      <Box component="span" sx={{ color: tokens.textMuted }}>
        {t('patients.noJourney')}
      </Box>
    )
  }
  const sorted = [...journeys].sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const getName = (j: PatientJourney) =>
    journeyTemplates.find((jt) => jt.id === j.journeyTemplateId)?.name ?? j.journeyTemplateId
  const overflow = sorted.length - max
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
      {sorted.slice(0, max).map((j) => (
        <Tag
          key={j.id}
          icon={<RouteIcon />}
          label={getName(j)}
          variant={j.status === 'ACTIVE' ? 'selected' : 'admin'}
          title={`${getName(j)} · ${t(`journey.journeyStatus.${j.status}`)}`}
        />
      ))}
      {overflow > 0 && (
        <Box
          component="span"
          title={t('patients.moreJourneys', { count: overflow })}
          sx={{ fontSize: 12, color: tokens.textSecondary }}
        >
          +{overflow}
        </Box>
      )}
    </Box>
  )
}
