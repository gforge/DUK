import { Chip, Stack, Tab, Tabs } from '@mui/material'
import React from 'react'

import type { JourneyTemplate, PatientJourney } from '@/api/schemas'
import { useJourneyStatusLabel } from '@/hooks/labels'

function journeyStatusColor(status: string): 'primary' | 'warning' | 'default' {
  if (status === 'ACTIVE') return 'primary'
  if (status === 'SUSPENDED') return 'warning'
  return 'default'
}

interface JourneySelectorTabsProps {
  readonly journeys: PatientJourney[]
  readonly selectedId: string | null
  readonly journeyTemplates: JourneyTemplate[] | undefined
  readonly onChange: (id: string) => void
}

export default function JourneySelectorTabs({
  journeys,
  selectedId,
  journeyTemplates,
  onChange,
}: JourneySelectorTabsProps) {
  const getJourneyStatusLabel = useJourneyStatusLabel()

  if (journeys.length <= 1) return null

  return (
    <Tabs
      value={selectedId ?? false}
      onChange={(_, id) => onChange(id as string)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
    >
      {journeys.map((j) => {
        const tmpl = journeyTemplates?.find((jt) => jt.id === j.journeyTemplateId)
        return (
          <Tab
            key={j.id}
            value={j.id}
            label={
              <Stack direction="row" alignItems="center" gap={0.5}>
                <span>{tmpl?.name ?? j.journeyTemplateId}</span>
                <Chip
                  label={getJourneyStatusLabel(j.status)}
                  size="small"
                  color={journeyStatusColor(j.status)}
                  variant="outlined"
                  sx={{ height: 18, fontSize: 10 }}
                />
              </Stack>
            }
          />
        )
      })}
    </Tabs>
  )
}
