import { useCallback,useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { JourneyModification,PatientJourney } from '@/api/schemas'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

interface UseJourneyActionsParams {
  readonly selectedJourney: PatientJourney | null
  readonly formResponses: { patientJourneyId?: string | null }[] | null | undefined
  readonly refetchJourneys: () => void
  readonly refetchSteps: () => void
}

export type ModifyPayload = {
  reason: string
  entry?: { label: string; offsetDays: number; windowDays: number; templateId: string }
  stepId?: string
  newTemplateId?: string
  previousTemplateId?: string
  previousStartDate?: string
  newStartDate?: string
}

export function useJourneyActions({
  selectedJourney,
  formResponses,
  refetchJourneys,
  refetchSteps,
}: UseJourneyActionsParams) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const { currentUser } = useRole()

  const [pauseLoading, setPauseLoading] = useState(false)
  const [pauseConfirmOpen, setPauseConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const hasJourneyData =
    selectedJourney != null &&
    (formResponses?.some((r) => r.patientJourneyId === selectedJourney.id) === true ||
      (selectedJourney.recurringCompletions?.length ?? 0) > 0)

  const handlePause = useCallback(async () => {
    if (!selectedJourney) return
    setPauseLoading(true)
    try {
      await client.pauseJourney(selectedJourney.id)
      showSnack(t('journey.pauseSuccess'), 'success')
      refetchJourneys()
      refetchSteps()
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setPauseLoading(false)
      setPauseConfirmOpen(false)
    }
  }, [selectedJourney, showSnack, t, refetchJourneys, refetchSteps])

  const handleResume = useCallback(async () => {
    if (!selectedJourney) return
    setPauseLoading(true)
    try {
      await client.resumeJourney(selectedJourney.id)
      showSnack(t('journey.resumeSuccess'), 'success')
      refetchJourneys()
      refetchSteps()
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setPauseLoading(false)
    }
  }, [selectedJourney, showSnack, t, refetchJourneys, refetchSteps])

  const handleModify = useCallback(
    async (type: 'ADD_STEP' | 'REMOVE_STEP' | 'SWITCH_TEMPLATE', payload: ModifyPayload) => {
      if (!selectedJourney || !currentUser) return
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
      await client.modifyPatientJourney(selectedJourney.id, modification)
      showSnack(t('journey.modify.saved'), 'success')
      refetchJourneys()
      refetchSteps()
    },
    [selectedJourney, currentUser, showSnack, t, refetchJourneys, refetchSteps],
  )

  const handleCancel = useCallback(
    async (reason: string) => {
      if (!selectedJourney || !currentUser) return
      setCancelLoading(true)
      try {
        const result = await client.cancelJourney(selectedJourney.id, reason, currentUser.id)
        showSnack(
          result.deleted ? t('journey.cancelSuccessDeleted') : t('journey.cancelSuccess'),
          'success',
        )
        refetchJourneys()
        refetchSteps()
        setCancelConfirmOpen(false)
      } catch {
        showSnack(t('common.error'), 'error')
      } finally {
        setCancelLoading(false)
      }
    },
    [selectedJourney, currentUser, showSnack, t, refetchJourneys, refetchSteps],
  )

  return {
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
  }
}
