import { Box, Stack, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { JourneyTemplate, TransitionTriggerType } from '@/api/schemas'
import { useTransitionTriggerLabel } from '@/hooks/labels'
interface Props {
  effectiveName: string
  personalNumber: string
  dateOfBirth: string
  noDigitalChannel: boolean
  selectedTemplate: JourneyTemplate | undefined | null
  eventType: TransitionTriggerType | ''
  startDate: string
  selectedModuleIds: string[]
  researchModules: Array<{
    id: string
    studyName: string
  }> | null
}
export function Step3Review({
  effectiveName,
  personalNumber,
  dateOfBirth,
  noDigitalChannel,
  selectedTemplate,
  eventType,
  startDate,
  selectedModuleIds,
  researchModules,
}: Props) {
  const { t } = useTranslation()
  const triggerLabel = useTransitionTriggerLabel()
  return (
    <Stack sx={{ gap: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {t('patients.register.reviewTitle')}
      </Typography>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
        <Stack sx={{ gap: 0.5 }}>
          <Typography variant="body2">
            <strong>{t('patients.displayName')}:</strong> {effectiveName}
          </Typography>
          <Typography variant="body2">
            <strong>{t('patients.personalNumber')}:</strong> {personalNumber}
          </Typography>
          <Typography variant="body2">
            <strong>{t('patients.dateOfBirth')}:</strong> {dateOfBirth}
          </Typography>
          {noDigitalChannel && (
            <Typography variant="body2">
              <strong>{t('patients.noDigitalChannel')}:</strong> {t('common.yes')}
            </Typography>
          )}
        </Stack>
      </Box>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
        <Stack sx={{ gap: 0.5 }}>
          <Typography variant="body2">
            <strong>{t('nav.journeys')}:</strong> {selectedTemplate?.name}
          </Typography>
          {eventType && (
            <Typography variant="body2">
              <strong>{t('patients.register.eventType')}:</strong> {triggerLabel(eventType)}
            </Typography>
          )}
          <Typography variant="body2">
            <strong>{selectedTemplate?.referenceDateLabel ?? t('journey.startDate')}:</strong>{' '}
            {startDate}
          </Typography>
        </Stack>
      </Box>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
        <Stack sx={{ gap: 0.5 }}>
          <Typography variant="body2">
            <strong>{t('patients.register.reviewStudies')}</strong>{' '}
            {selectedModuleIds.length === 0
              ? t('patients.register.noStudiesSelected')
              : researchModules
                  ?.filter((rm) => selectedModuleIds.includes(rm.id))
                  .map((rm) => rm.studyName)
                  .join(', ')}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  )
}
