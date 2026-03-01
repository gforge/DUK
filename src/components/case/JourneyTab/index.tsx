import React, { useState, useMemo } from 'react'
import { Alert, Box, Paper, Skeleton, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../../hooks/useApi'
import * as client from '../../../api/client'
import JourneyTimeline from '../../journey/JourneyTimeline'
import ModifyJourneyDialog from '../../journey/ModifyJourneyDialog'
import JourneyModHistory from '../journey/JourneyModHistory'
import PatientJourneyResearchCard from '../../patients/PatientJourneyResearchCard'
import JourneySelectorTabs from './JourneySelectorTabs'
import JourneyHeader from './JourneyHeader'
import CancelJourneyDialog from './CancelJourneyDialog'
import PauseConfirmDialog from './PauseConfirmDialog'
import { useJourneyActions } from './useJourneyActions'
import type { Case } from '../../../api/schemas'

const STATUS_ORDER: Record<string, number> = { ACTIVE: 0, SUSPENDED: 1, COMPLETED: 2 }

interface JourneyTabProps {
  readonly caseData: Case
}

export default function JourneyTab({ caseData }: JourneyTabProps) {
  const { t } = useTranslation()

  const [modifyOpen, setModifyOpen] = useState(false)
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null)

  const {
    data: journeys,
    loading: journeysLoading,
    refetch: refetchJourneys,
  } = useApi(() => client.getPatientJourneys(caseData.patientId), [caseData.patientId])

  const { data: formResponses } = useApi(() => client.getFormResponses(caseData.id), [caseData.id])
  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])
  const { data: researchModules } = useApi(() => client.getResearchModules(), [])
  const { data: questionnaireTemplates } = useApi(() => client.getQuestionnaireTemplates(), [])
  const { data: allConsents, refetch: refetchConsents } = useApi(
    () => client.getResearchConsents(caseData.patientId),
    [caseData.patientId],
  )

  const sortedJourneys = useMemo(() => {
    if (!journeys) return []
    return [...journeys].sort(
      (a, b) =>
        (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [journeys])

  const selectedJourney =
    sortedJourneys.find((j) => j.id === selectedJourneyId) ?? sortedJourneys[0] ?? null

  const { data: effectiveSteps, refetch: refetchSteps } = useApi(
    () => (selectedJourney ? client.getEffectiveSteps(selectedJourney.id) : Promise.resolve([])),
    [selectedJourney?.id],
  )

  const currentTemplate = journeyTemplates?.find(
    (jt) => jt.id === selectedJourney?.journeyTemplateId,
  )

  const {
    pauseLoading,
    pauseConfirmOpen,
    setPauseConfirmOpen,
    handlePause,
    handleResume,
    handleModify,
    cancelConfirmOpen,
    setCancelConfirmOpen,
    cancelLoading,
    hasJourneyData,
    handleCancel,
  } = useJourneyActions({ selectedJourney, formResponses, refetchJourneys, refetchSteps })

  // Capture mount time once via lazy initializer — avoids calling Date.now() during render
  const [mountedAt] = useState(Date.now)
  const pausedDays = selectedJourney?.pausedAt
    ? Math.max(
        0,
        Math.floor((mountedAt - new Date(selectedJourney.pausedAt).getTime()) / 86_400_000),
      )
    : 0

  if (journeysLoading) {
    return (
      <Stack gap={1}>
        <Skeleton variant="text" width={200} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
      </Stack>
    )
  }

  if (sortedJourneys.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        {t('journey.noActiveJourney')}
      </Alert>
    )
  }

  return (
    <Box>
      <JourneySelectorTabs
        journeys={sortedJourneys}
        selectedId={selectedJourney?.id ?? null}
        journeyTemplates={journeyTemplates ?? undefined}
        onChange={setSelectedJourneyId}
      />

      {selectedJourney && (
        <>
          <JourneyHeader
            journey={selectedJourney}
            template={currentTemplate}
            showStatusChip={sortedJourneys.length === 1}
            pauseLoading={pauseLoading}
            onPauseClick={() => setPauseConfirmOpen(true)}
            onModifyClick={() => setModifyOpen(true)}
            onResume={handleResume}
            onCancelClick={() => setCancelConfirmOpen(true)}
          />

          {selectedJourney.status === 'SUSPENDED' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {pausedDays === 0
                ? t('journey.pausedBannerToday')
                : t('journey.pausedBanner', { days: pausedDays, count: pausedDays })}
            </Alert>
          )}

          <PatientJourneyResearchCard
            journey={selectedJourney}
            patientId={caseData.patientId}
            allModules={researchModules ?? []}
            consents={allConsents ?? []}
            onChanged={() => {
              refetchJourneys()
              refetchConsents()
            }}
          />

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
            <JourneyTimeline
              steps={effectiveSteps ?? []}
              formResponses={formResponses ?? []}
              journeyName={currentTemplate?.description}
            />
          </Paper>

          <JourneyModHistory
            modifications={selectedJourney.modifications}
            journeyTemplates={journeyTemplates}
          />

          {modifyOpen && journeyTemplates && questionnaireTemplates && effectiveSteps && (
            <ModifyJourneyDialog
              open={modifyOpen}
              onClose={() => setModifyOpen(false)}
              journeyId={selectedJourney.id}
              currentTemplateId={selectedJourney.journeyTemplateId}
              currentTemplateName={currentTemplate?.name ?? ''}
              currentStartDate={selectedJourney.startDate}
              steps={effectiveSteps}
              journeyTemplates={journeyTemplates}
              questionnaireTemplates={questionnaireTemplates}
              onModify={handleModify}
            />
          )}

          <PauseConfirmDialog
            open={pauseConfirmOpen}
            loading={pauseLoading}
            onClose={() => setPauseConfirmOpen(false)}
            onConfirm={handlePause}
          />

          <CancelJourneyDialog
            open={cancelConfirmOpen}
            loading={cancelLoading}
            hasData={hasJourneyData}
            onClose={() => setCancelConfirmOpen(false)}
            onConfirm={handleCancel}
          />
        </>
      )}
    </Box>
  )
}
