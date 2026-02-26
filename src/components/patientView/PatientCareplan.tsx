import React from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import RouteIcon from '@mui/icons-material/Route'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../hooks/useApi'
import * as client from '../../api/client'
import JourneyTimeline from '../journey/JourneyTimeline'
import type { PatientJourney, JourneyTemplate } from '../../api/schemas'

interface Props {
  activeJourney: PatientJourney | undefined
  journeyTemplates: JourneyTemplate[] | null
}

export default function PatientCareplan({ activeJourney, journeyTemplates }: Props) {
  const { t } = useTranslation()

  const { data: effectiveSteps } = useApi(
    () => (activeJourney ? client.getEffectiveSteps(activeJourney.id) : Promise.resolve([])),
    [activeJourney?.id],
  )

  const journeyName = activeJourney
    ? journeyTemplates?.find((jt) => jt.id === activeJourney.journeyTemplateId)?.name
    : undefined

  return (
    <Paper variant="outlined" sx={{ mb: 3, borderRadius: 2, p: 2 }}>
      <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
        <RouteIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={600}>
          {t('patient.carePlan')}
        </Typography>
      </Stack>
      {activeJourney && effectiveSteps ? (
        <JourneyTimeline steps={effectiveSteps} formResponses={[]} journeyName={journeyName} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('patient.noCarePlan')}
        </Typography>
      )}
    </Paper>
  )
}
