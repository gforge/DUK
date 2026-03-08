import RouteIcon from '@mui/icons-material/Route'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Step,
  StepLabel,
  Stepper,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { ResearchModule } from '@/api/schemas'
import type { JourneyStepConflict } from '@/api/service'
import { useApi } from '@/hooks/useApi'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

import ConsentPhase from './ConsentPhase'
import WizardStep0 from './WizardStep0'
import WizardStep1 from './WizardStep1'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly patientId: string
  readonly patientName: string
  readonly onAssigned: () => void
}

export default function AssignJourneyDialog({
  open,
  onClose,
  patientId,
  patientName,
  onAssigned,
}: Props) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const { currentUser } = useRole()

  // Step 0 — template / date / research modules
  const [wizardStep, setWizardStep] = useState(0)
  const [journeyTemplateId, setJourneyTemplateId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([])

  // Step 1 — conflict resolution
  const [conflicts, setConflicts] = useState<JourneyStepConflict[]>([])
  const [loadingConflicts, setLoadingConflicts] = useState(false)
  const [mergedStepIds, setMergedStepIds] = useState<{ stepId: string; fromJourneyId: string }[]>(
    [],
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Consent phase (after journey is assigned)
  const [phase, setPhase] = useState<'wizard' | 'consent'>('wizard')
  const [assignedJourneyId, setAssignedJourneyId] = useState('')
  const [consentQueue, setConsentQueue] = useState<ResearchModule[]>([])
  const [consentIndex, setConsentIndex] = useState(0)
  const [consentChecked, setConsentChecked] = useState(false)

  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])
  const { data: researchModules } = useApi(() => client.getResearchModules(), [])

  const handleClose = () => {
    setWizardStep(0)
    setJourneyTemplateId('')
    setStartDate(new Date().toISOString().slice(0, 10))
    setSelectedModuleIds([])
    setConflicts([])
    setMergedStepIds([])
    setError(null)
    setPhase('wizard')
    setAssignedJourneyId('')
    setConsentQueue([])
    setConsentIndex(0)
    setConsentChecked(false)
    onClose()
  }

  const handleNext = async () => {
    if (!journeyTemplateId || !startDate) {
      setError(t('patients.register.journeyRequired'))
      return
    }
    setError(null)
    setLoadingConflicts(true)
    setWizardStep(1)
    try {
      const detected = await client.detectJourneyConflicts(patientId, journeyTemplateId, startDate)
      setConflicts(detected)
      setMergedStepIds(
        detected.map((c) => ({ stepId: c.newStep.id, fromJourneyId: c.existingJourneyId })),
      )
    } catch {
      setConflicts([])
    } finally {
      setLoadingConflicts(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      const result = await client.assignPatientJourney(
        patientId,
        journeyTemplateId,
        startDate,
        selectedModuleIds,
        mergedStepIds,
      )
      const modulesToConsent =
        researchModules?.filter((rm) => selectedModuleIds.includes(rm.id)) ?? []
      if (modulesToConsent.length > 0) {
        setAssignedJourneyId(result.id)
        setConsentQueue(modulesToConsent)
        setConsentIndex(0)
        setConsentChecked(false)
        setPhase('consent')
      } else {
        showSnack(t('patients.journeyAssigned'), 'success')
        onAssigned()
        handleClose()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const advanceConsent = () => {
    const nextIndex = consentIndex + 1
    if (nextIndex < consentQueue.length) {
      setConsentIndex(nextIndex)
      setConsentChecked(false)
    } else {
      showSnack(t('patients.journeyAssigned'), 'success')
      onAssigned()
      handleClose()
    }
  }

  const handleGrantConsent = async () => {
    if (!consentChecked) return
    const module = consentQueue[consentIndex]
    if (!module) return
    try {
      await client.grantConsent(patientId, module.id, assignedJourneyId, currentUser.id)
      showSnack(t('journey.research.consent.grantSuccess'), 'success')
    } catch {
      showSnack(t('common.error'), 'error')
    }
    advanceConsent()
  }

  const toggleMerge = (stepId: string, fromJourneyId: string, checked: boolean) => {
    setMergedStepIds((prev) =>
      checked
        ? [...prev.filter((m) => m.stepId !== stepId), { stepId, fromJourneyId }]
        : prev.filter((m) => m.stepId !== stepId),
    )
  }

  const wizardStepLabels = [t('patients.register.stepJourney'), t('patients.conflicts.step')]

  if (phase === 'consent') {
    const currentModule = consentQueue[consentIndex]
    if (!currentModule) return null
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <ConsentPhase
          module={currentModule}
          current={consentIndex + 1}
          total={consentQueue.length}
          checked={consentChecked}
          onCheck={setConsentChecked}
          onGrant={handleGrantConsent}
          onSkip={advanceConsent}
        />
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <RouteIcon color="primary" />
          {t('patients.assignJourney')} — {patientName}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={wizardStep} sx={{ mb: 3, mt: 1 }}>
          {wizardStepLabels.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {wizardStep === 0 && (
          <WizardStep0
            journeyTemplateId={journeyTemplateId}
            startDate={startDate}
            selectedModuleIds={selectedModuleIds}
            journeyTemplates={journeyTemplates ?? undefined}
            researchModules={researchModules ?? undefined}
            onTemplateChange={setJourneyTemplateId}
            onDateChange={setStartDate}
            onModulesChange={setSelectedModuleIds}
          />
        )}

        {wizardStep === 1 && (
          <WizardStep1
            loadingConflicts={loadingConflicts}
            conflicts={conflicts}
            mergedStepIds={mergedStepIds}
            onToggleMerge={toggleMerge}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        {wizardStep === 1 && (
          <Button onClick={() => setWizardStep(0)} disabled={saving || loadingConflicts}>
            {t('common.back')}
          </Button>
        )}
        <Button onClick={handleClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        {wizardStep === 0 ? (
          <Button variant="contained" onClick={handleNext} disableElevation>
            {t('common.next')}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving || loadingConflicts}
            disableElevation
          >
            {saving ? t('common.saving') : t('common.confirm')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
