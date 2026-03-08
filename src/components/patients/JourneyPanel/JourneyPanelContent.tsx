import { Alert, Box, Divider, Stack, Typography } from '@mui/material'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { JourneyTemplate, PatientJourney, QuestionnaireTemplate } from '@/api/schemas'
import type { ResolvedInstruction } from '@/api/service'
import CancelJourneyDialog from '@/components/case/JourneyTab/CancelJourneyDialog'
import PauseConfirmDialog from '@/components/case/JourneyTab/PauseConfirmDialog'
import { useJourneyActions } from '@/components/case/JourneyTab/useJourneyActions'
import { InstructionTimeline, JourneyTimeline, ModifyJourneyDialog } from '@/components/journey'
import { InstructionModifyDialog } from '@/components/journey/InstructionModifyDialog'
import { useApi } from '@/hooks/useApi'

import { JourneyPanelActions } from './JourneyPanelActions'

interface Props {
  readonly journey: PatientJourney
  readonly journeyTemplates: JourneyTemplate[]
  readonly questionnaireTemplates: QuestionnaireTemplate[]
  readonly onJourneyChanged: () => void
}

export function JourneyPanelContent({
  journey,
  journeyTemplates,
  questionnaireTemplates,
  onJourneyChanged,
}: Props) {
  const { t } = useTranslation()

  const [modifyOpen, setModifyOpen] = useState(false)
  const [instrTarget, setInstrTarget] = useState<ResolvedInstruction | null>(null)
  const [instrDialogOpen, setInstrDialogOpen] = useState(false)
  const [instrInitialTab, setInstrInitialTab] = useState(0)

  const [mountedAt] = useState(Date.now)

  const { data: effectiveSteps, refetch: refetchSteps } = useApi(
    () => client.getEffectiveSteps(journey.id),
    [journey.id],
  )

  const { data: formResponses } = useApi(
    () => client.getFormResponsesByJourney(journey.id),
    [journey.id],
  )

  const { data: resolvedInstructions, refetch: refetchInstructions } = useApi(
    () => client.getResolvedInstructionsForJourney(journey.id),
    [journey.id],
  )

  // useJourneyActions works with a single-journey context; provide empty refetchSteps wrapper
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
  } = useJourneyActions({
    selectedJourney: journey,
    formResponses,
    refetchJourneys: onJourneyChanged,
    refetchSteps,
  })

  const currentTemplate = useMemo(
    () => journeyTemplates.find((jt) => jt.id === journey.journeyTemplateId),
    [journeyTemplates, journey.journeyTemplateId],
  )

  const pausedDays = journey.pausedAt
    ? Math.max(0, Math.floor((mountedAt - new Date(journey.pausedAt).getTime()) / 86_400_000))
    : 0

  return (
    <Stack gap={2}>
      <JourneyPanelActions
        journey={journey}
        pauseLoading={pauseLoading}
        onPauseClick={() => setPauseConfirmOpen(true)}
        onResume={handleResume}
        onModifyClick={() => setModifyOpen(true)}
        onCancelClick={() => setCancelConfirmOpen(true)}
      />

      {journey.status === 'SUSPENDED' && (
        <Alert severity="warning">
          {pausedDays === 0
            ? t('journey.pausedBannerToday')
            : t('journey.pausedBanner', { days: pausedDays, count: pausedDays })}
        </Alert>
      )}

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('journey.instructionsSection')}
        </Typography>
        <InstructionTimeline
          instructions={resolvedInstructions ?? []}
          onModify={(instr, tab) => {
            setInstrTarget(instr)
            setInstrInitialTab(tab)
            setInstrDialogOpen(true)
          }}
          onAdd={
            journey.status !== 'COMPLETED'
              ? () => {
                  setInstrTarget(null)
                  setInstrDialogOpen(true)
                }
              : undefined
          }
        />
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('journey.followUpSection')}
        </Typography>
        <JourneyTimeline
          steps={effectiveSteps ?? []}
          formResponses={formResponses ?? []}
          journeyName={currentTemplate?.description}
          hideUnrealized={journey.status === 'COMPLETED'}
        />
      </Box>

      {instrDialogOpen && (
        <InstructionModifyDialog
          open={instrDialogOpen}
          onClose={() => setInstrDialogOpen(false)}
          journeyId={journey.id}
          instruction={instrTarget}
          initialTab={instrInitialTab}
          onChanged={() => {
            setInstrDialogOpen(false)
            refetchInstructions()
          }}
        />
      )}

      {modifyOpen && currentTemplate && (
        <ModifyJourneyDialog
          open={modifyOpen}
          onClose={() => setModifyOpen(false)}
          journeyId={journey.id}
          currentTemplateId={journey.journeyTemplateId}
          currentTemplateName={currentTemplate.name}
          currentStartDate={journey.startDate}
          steps={effectiveSteps ?? []}
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
    </Stack>
  )
}
