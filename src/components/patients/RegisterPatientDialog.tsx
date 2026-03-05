import React, { useState } from 'react'
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
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import { useTranslation } from 'react-i18next'
import { useApi } from '@/hooks/useApi'
import { useSnack } from '@/store/snackContext'
import * as client from '@/api/client'
import { parsePersonnummer } from '@/api/utils/personnummer'

// split steps to reduce component length
import { Step0PatientDetails } from './register-dialog/Step0PatientDetails'
import { Step1JourneyAssignment } from './register-dialog/Step1JourneyAssignment'
import { Step2ResearchModules } from './register-dialog/Step2ResearchModules'
import { Step3Review } from './register-dialog/Step3Review'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export default function RegisterPatientDialog({ open, onClose, onCreated }: Props) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hintOpen, setHintOpen] = useState(false)

  // Step 0 — patient details
  const [personalNumber, setPersonalNumber] = useState('')
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not-found'>(
    'idle',
  )
  const [registerName, setRegisterName] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  // Step 1 — journey assignment
  const [journeyTemplateId, setJourneyTemplateId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))

  // Step 2 — research module enrollment
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([])

  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])
  const { data: researchModules } = useApi(() => client.getResearchModules(), [])
  const { data: demoHints } = useApi(() => client.getDemoRegisterHints(), [])
  const { data: existingPatients } = useApi(() => client.getPatients(), [])

  const steps = [
    t('patients.register.stepPatient'),
    t('patients.register.stepJourney'),
    t('patients.register.stepStudies'),
    t('patients.register.stepConfirm'),
  ]

  const pnrInfo = parsePersonnummer(personalNumber)

  const handleClose = () => {
    setStep(0)
    setPersonalNumber('')
    setLookupStatus('idle')
    setRegisterName(null)
    setDisplayName('')
    setDateOfBirth('')
    setJourneyTemplateId('')
    setStartDate(new Date().toISOString().slice(0, 10))
    setSelectedModuleIds([])
    setError(null)
    setHintOpen(false)
    onClose()
  }

  const handleLookup = async () => {
    setLookupStatus('loading')
    setError(null)
    setRegisterName(null)
    setDisplayName('')
    try {
      const result = await client.lookupPersonnummer(personalNumber)
      if (result) {
        setRegisterName(result.displayName)
        setLookupStatus('found')
      } else {
        setLookupStatus('not-found')
      }
      if (pnrInfo.dateOfBirth) setDateOfBirth(pnrInfo.dateOfBirth)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
      setLookupStatus('idle')
    }
  }

  const handleNext = () => {
    setError(null)
    if (step === 0) {
      if (!personalNumber.trim() || !pnrInfo.isValid) {
        setError(t('patients.register.requiredFields'))
        return
      }
      if (lookupStatus === 'idle') {
        setError(t('patients.register.fetchFirst'))
        return
      }
      const effectiveName = displayName.trim() || registerName || ''
      if (!effectiveName) {
        setError(t('patients.register.requiredFields'))
        return
      }
      if (pnrInfo.isReservnummer && !dateOfBirth) {
        setError(t('patients.register.requiredFields'))
        return
      }
    } else if (step === 1) {
      if (!journeyTemplateId || !startDate) {
        setError(t('patients.register.journeyRequired'))
        return
      }
    }
    setStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    const effectiveName = displayName.trim() || registerName || ''
    const effectiveDob = pnrInfo.dateOfBirth ?? dateOfBirth
    try {
      const patient = await client.createPatient({
        displayName: effectiveName,
        personalNumber,
        dateOfBirth: effectiveDob,
      })
      await client.assignPatientJourney(patient.id, journeyTemplateId, startDate, selectedModuleIds)
      showSnack(t('patients.register.success'), 'success')
      onCreated()
      handleClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const effectiveName = displayName.trim() || registerName || ''
  const selectedTemplate = journeyTemplates?.find((jt) => jt.id === journeyTemplateId)

  const registeredPnrs = new Set(
    (existingPatients ?? []).map((p) => p.personalNumber.replace(/[-+ ]/g, '')),
  )

  const fillPnr = (pnr: string) => {
    setPersonalNumber(pnr)
    setLookupStatus('idle')
    setRegisterName(null)
    setDisplayName('')
    setDateOfBirth('')
    setHintOpen(false)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <PersonAddAltIcon color="primary" />
          {t('patients.register.title')}
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 3, mt: 1 }}>
          {steps.map((label) => (
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

        {/* ── Step 0: Patient details ── */}
        {step === 0 && (
          <Step0PatientDetails
            personalNumber={personalNumber}
            setPersonalNumber={setPersonalNumber}
            lookupStatus={lookupStatus}
            _lookupName={registerName}
            displayName={displayName}
            setDisplayName={setDisplayName}
            dateOfBirth={dateOfBirth}
            setDateOfBirth={setDateOfBirth}
            registerName={registerName}
            hintOpen={hintOpen}
            setHintOpen={setHintOpen}
            registeredPnrs={registeredPnrs}
            demoHints={demoHints ?? []}
            handleLookup={handleLookup}
            onSelectPnr={fillPnr}
          />
        )}
        {/* ── Step 1: Journey assignment ── */}
        {step === 1 && (
          <Step1JourneyAssignment
            journeyTemplateId={journeyTemplateId}
            setJourneyTemplateId={setJourneyTemplateId}
            startDate={startDate}
            setStartDate={setStartDate}
            journeyTemplates={journeyTemplates}
          />
        )}

        {/* ── Step 2: Research modules ── */}
        {step === 2 && (
          <Step2ResearchModules
            selectedModuleIds={selectedModuleIds}
            setSelectedModuleIds={setSelectedModuleIds}
            researchModules={researchModules}
          />
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <Step3Review
            effectiveName={effectiveName}
            personalNumber={personalNumber}
            dateOfBirth={pnrInfo.dateOfBirth ?? dateOfBirth}
            selectedTemplate={selectedTemplate}
            startDate={startDate}
            selectedModuleIds={selectedModuleIds}
            researchModules={
              researchModules
                ? researchModules.map((rm) => ({ id: rm.id, studyName: rm.studyName }))
                : null
            }
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        {step > 0 && (
          <Button onClick={() => setStep((s) => s - 1)} disabled={saving}>
            {t('common.back')}
          </Button>
        )}
        {step < 3 ? (
          <Button variant="contained" onClick={handleNext} disableElevation>
            {t('common.next')}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleSubmit} disabled={saving} disableElevation>
            {saving ? t('common.saving') : t('patients.register.confirm')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
