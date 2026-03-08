import { Alert, Box, Paper, Skeleton, Stack } from '@mui/material'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { Case } from '@/api/schemas'
import type { ResolvedInstruction } from '@/api/service'
import JourneyModHistory from '@/components/case/JourneyTab/JourneyModHistory'
import { InstructionTimeline, JourneyTimeline } from '@/components/journey'
import { ModifyJourneyDialog } from '@/components/journey'
import { StartNextPhaseDialog } from '@/components/journey'
import { InstructionModifyDialog } from '@/components/journey/InstructionModifyDialog'
import { PatientJourneyResearchCard } from '@/components/patients'
import { useApi } from '@/hooks/useApi'
import { useRole } from '@/store/roleContext'

import CancelJourneyDialog from './CancelJourneyDialog'
import EpisodeHeader from './EpisodeHeader'
import JourneyHeader from './JourneyHeader'
import JourneySelectorTabs from './JourneySelectorTabs'
import PauseConfirmDialog from './PauseConfirmDialog'
import { useJourneyActions } from './useJourneyActions'

const STATUS_ORDER: Record<string, number> = { ACTIVE: 0, SUSPENDED: 1, COMPLETED: 2 }

interface JourneyTabProps {
  readonly caseData: Case
}

export default function JourneyTab({ caseData }: JourneyTabProps) {
  const { t } = useTranslation()
  const { currentUser } = useRole()

  const [modifyOpen, setModifyOpen] = useState(false)
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null)
  const [startNextPhaseOpen, setStartNextPhaseOpen] = useState(false)
  const [instructionTarget, setInstructionTarget] = useState<ResolvedInstruction | null>(null)
  const [instructionDialogOpen, setInstructionDialogOpen] = useState(false)
  const [instructionInitialTab, setInstructionInitialTab] = useState(0)

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

  const { data: episode, loading: episodeLoading } = useApi(
    () =>
      selectedJourney?.episodeId
        ? client.getEpisodeById(selectedJourney.episodeId)
        : Promise.resolve(undefined),
    [selectedJourney?.episodeId],
  )

  const { data: resolvedInstructions, refetch: refetchInstructions } = useApi(
    () =>
      selectedJourney
        ? client.getResolvedInstructionsForJourney(selectedJourney.id)
        : Promise.resolve([]),
    [selectedJourney?.id],
  )

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

  const handleAddReview = async (
    stepId: string,
    reviewType: string,
    description?: string,
    stepLabel?: string,
  ): Promise<string> => {
    const review = await client.createReview(
      caseData.id,
      reviewType as 'LAB' | 'XRAY',
      currentUser.id,
      currentUser.role,
      'JOURNEY',
      description,
      stepLabel,
    )
    return review.id
  }

  const handleRemoveReview = async (reviewId: string): Promise<void> => {
    await client.deleteReview(reviewId, caseData.id)
  }
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
      <EpisodeHeader episode={episode} loading={episodeLoading && !!selectedJourney?.episodeId} />

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
            onStartNextPhase={
              selectedJourney.status === 'ACTIVE' &&
              (currentUser.role === 'DOCTOR' || currentUser.role === 'PAL')
                ? () => setStartNextPhaseOpen(true)
                : undefined
            }
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
            <Box sx={{ mb: 2 }}>
              <Alert severity="info" sx={{ mb: 1 }}>
                {t('journey.instructionsSection')}
              </Alert>
              <InstructionTimeline
                instructions={resolvedInstructions ?? []}
                onModify={(instr, tab) => {
                  setInstructionTarget(instr)
                  setInstructionInitialTab(tab)
                  setInstructionDialogOpen(true)
                }}
                onAdd={() => {
                  setInstructionTarget(null)
                  setInstructionDialogOpen(true)
                }}
              />
            </Box>

            <JourneyTimeline
              steps={effectiveSteps ?? []}
              formResponses={formResponses ?? []}
              journeyName={currentTemplate?.description}
              onAddReview={handleAddReview}
              onRemoveReview={handleRemoveReview}
            />
          </Paper>

          <JourneyModHistory modifications={selectedJourney.modifications} />

          {instructionDialogOpen && selectedJourney && (
            <InstructionModifyDialog
              open={instructionDialogOpen}
              onClose={() => setInstructionDialogOpen(false)}
              journeyId={selectedJourney.id}
              instruction={instructionTarget}
              initialTab={instructionInitialTab}
              onChanged={() => {
                setInstructionDialogOpen(false)
                refetchInstructions()
              }}
            />
          )}

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

          {startNextPhaseOpen && journeyTemplates && (
            <StartNextPhaseDialog
              open={startNextPhaseOpen}
              onClose={() => setStartNextPhaseOpen(false)}
              journey={selectedJourney}
              journeyTemplates={journeyTemplates}
              onCompleted={() => {
                setStartNextPhaseOpen(false)
                refetchJourneys()
              }}
            />
          )}
        </>
      )}
    </Box>
  )
}
