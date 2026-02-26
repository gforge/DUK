import React, { useState, useCallback } from 'react'
import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import RouteIcon from '@mui/icons-material/Route'
import ScienceIcon from '@mui/icons-material/Science'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../hooks/useApi'
import * as client from '../../api/client'
import { useSnack } from '../../store/snackContext'
import { useRole } from '../../store/roleContext'
import JourneyTimeline from '../journey/JourneyTimeline'
import ModifyJourneyDialog from '../journey/ModifyJourneyDialog'
import JourneyModHistory from './journey/JourneyModHistory'
import type { Case, JourneyModification } from '../../api/schemas'

interface JourneyTabProps {
  caseData: Case
}

export default function JourneyTab({ caseData }: JourneyTabProps) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const { currentUser } = useRole()
  const [modifyOpen, setModifyOpen] = useState(false)

  const {
    data: journeys,
    loading: journeysLoading,
    refetch: refetchJourneys,
  } = useApi(() => client.getPatientJourneys(caseData.patientId), [caseData.patientId])
  const { data: formResponses } = useApi(() => client.getFormResponses(caseData.id), [caseData.id])
  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])
  const { data: researchModules } = useApi(() => client.getResearchModules(), [])
  const { data: questionnaireTemplates } = useApi(() => client.getQuestionnaireTemplates(), [])

  const activeJourney = journeys
    ?.filter((j) => j.status === 'ACTIVE')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  const { data: effectiveSteps, refetch: refetchSteps } = useApi(
    () => (activeJourney ? client.getEffectiveSteps(activeJourney.id) : Promise.resolve([])),
    [activeJourney?.id],
  )

  const currentTemplate = journeyTemplates?.find((jt) => jt.id === activeJourney?.journeyTemplateId)

  const handleModify = useCallback(
    async (
      type: 'ADD_STEP' | 'REMOVE_STEP' | 'SWITCH_TEMPLATE',
      payload: {
        reason: string
        entry?: { label: string; offsetDays: number; windowDays: number; templateId: string }
        stepId?: string
        newTemplateId?: string
        previousTemplateId?: string
        previousStartDate?: string
        newStartDate?: string
      },
    ) => {
      if (!activeJourney || !currentUser) return
      const modification: Omit<JourneyModification, 'id' | 'addedAt'> = {
        type,
        addedByUserId: currentUser.id,
        reason: payload.reason,
        ...(payload.stepId ? { stepId: payload.stepId } : {}),
        ...(payload.newTemplateId ? { newTemplateId: payload.newTemplateId } : {}),
        ...(payload.previousTemplateId ? { previousTemplateId: payload.previousTemplateId } : {}),
        ...(payload.previousStartDate ? { previousStartDate: payload.previousStartDate } : {}),
        ...(payload.newStartDate ? { newStartDate: payload.newStartDate } : {}),
        ...(payload.entry
          ? {
              entry: {
                id: `step-${Date.now()}`,
                label: payload.entry.label,
                offsetDays: payload.entry.offsetDays,
                windowDays: payload.entry.windowDays,
                order: payload.entry.offsetDays,
                templateId: payload.entry.templateId,
                scoreAliases: {},
                scoreAliasLabels: {},
                dashboardCategory: 'CONTROL' as const,
              },
            }
          : {}),
      }
      await client.modifyPatientJourney(activeJourney.id, modification)
      showSnack(t('journey.modify.saved'), 'success')
      refetchJourneys()
      refetchSteps()
    },
    [activeJourney, currentUser, showSnack, t, refetchJourneys, refetchSteps],
  )

  if (journeysLoading) {
    return (
      <Stack gap={1}>
        <Skeleton variant="text" width={200} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
      </Stack>
    )
  }

  if (!activeJourney) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        {t('journey.noActiveJourney')}
      </Alert>
    )
  }

  const enrolledModules = researchModules?.filter((rm) =>
    activeJourney.researchModuleIds.includes(rm.id),
  )

  return (
    <Box>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2}>
        <Stack gap={0.5}>
          <Stack direction="row" alignItems="center" gap={1}>
            <RouteIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700}>
              {currentTemplate?.name ?? activeJourney.journeyTemplateId}
            </Typography>
            <Chip
              label={t(`journey.journeyStatus.${activeJourney.status}`)}
              size="small"
              color={activeJourney.status === 'ACTIVE' ? 'primary' : 'default'}
              variant="outlined"
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {t('journey.startDate')}: {activeJourney.startDate}
          </Typography>
        </Stack>
        {activeJourney.status === 'ACTIVE' && (
          <Button
            startIcon={<EditIcon />}
            size="small"
            variant="outlined"
            onClick={() => setModifyOpen(true)}
          >
            {t('journey.modify.action')}
          </Button>
        )}
      </Stack>

      {enrolledModules && enrolledModules.length > 0 && (
        <Stack direction="row" gap={1} mb={2} flexWrap="wrap">
          {enrolledModules.map((rm) => (
            <Chip
              key={rm.id}
              icon={<ScienceIcon />}
              label={rm.name}
              size="small"
              color="secondary"
              variant="outlined"
            />
          ))}
        </Stack>
      )}

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <JourneyTimeline
          steps={effectiveSteps ?? []}
          formResponses={formResponses ?? []}
          journeyName={currentTemplate?.description}
        />
      </Paper>

      <JourneyModHistory
        modifications={activeJourney.modifications}
        journeyTemplates={journeyTemplates}
      />

      {modifyOpen && journeyTemplates && questionnaireTemplates && effectiveSteps && (
        <ModifyJourneyDialog
          open={modifyOpen}
          onClose={() => setModifyOpen(false)}
          journeyId={activeJourney.id}
          currentTemplateId={activeJourney.journeyTemplateId}
          currentTemplateName={currentTemplate?.name ?? ''}
          currentStartDate={activeJourney.startDate}
          steps={effectiveSteps}
          journeyTemplates={journeyTemplates}
          questionnaireTemplates={questionnaireTemplates}
          onModify={handleModify}
        />
      )}
    </Box>
  )
}
