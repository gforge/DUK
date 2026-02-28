import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'
import RouteIcon from '@mui/icons-material/Route'
import ScienceIcon from '@mui/icons-material/Science'
import MergeIcon from '@mui/icons-material/MergeType'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../hooks/useApi'
import { useSnack } from '../../store/snackContext'
import * as client from '../../api/client'
import type { JourneyStepConflict } from '../../api/service'

interface Props {
  open: boolean
  onClose: () => void
  patientId: string
  patientName: string
  onAssigned: () => void
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

  // Step 0 — template / date / research modules
  const [wizardStep, setWizardStep] = useState(0)
  const [journeyTemplateId, setJourneyTemplateId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([])

  // Step 1 — conflict resolution
  const [conflicts, setConflicts] = useState<JourneyStepConflict[]>([])
  const [loadingConflicts, setLoadingConflicts] = useState(false)
  /**
   * stepId keys of new-journey steps the clinician has chosen to remove
   * (because the patient will fill them through the existing journey instead).
   */
  const [mergedStepIds, setMergedStepIds] = useState<{ stepId: string; fromJourneyId: string }[]>(
    [],
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      // Default: all conflicts are merged (checked) — clinician can uncheck to keep both
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
      await client.assignPatientJourney(
        patientId,
        journeyTemplateId,
        startDate,
        selectedModuleIds,
        mergedStepIds,
      )
      showSnack(t('patients.journeyAssigned'), 'success')
      onAssigned()
      handleClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const toggleMerge = (stepId: string, fromJourneyId: string, checked: boolean) => {
    setMergedStepIds((prev) =>
      checked
        ? [...prev.filter((m) => m.stepId !== stepId), { stepId, fromJourneyId }]
        : prev.filter((m) => m.stepId !== stepId),
    )
  }

  const wizardSteps = [t('patients.register.stepJourney'), t('patients.conflicts.step')]

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
          {wizardSteps.map((label) => (
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

        {/* ── Step 0: Template / start date / research ── */}
        {wizardStep === 0 && (
          <Stack gap={2}>
            <FormControl size="small" fullWidth required>
              <InputLabel>{t('patients.register.selectTemplate')}</InputLabel>
              <Select
                value={journeyTemplateId}
                onChange={(e) => setJourneyTemplateId(e.target.value)}
                label={t('patients.register.selectTemplate')}
              >
                {journeyTemplates?.map((jt) => (
                  <MenuItem key={jt.id} value={jt.id}>
                    {jt.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t('patients.register.referenceDate')}
              helperText={t('patients.register.referenceDateHint')}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            {researchModules && researchModules.length > 0 && (
              <>
                <Divider />
                <Typography variant="body2" fontWeight={600}>
                  {t('patients.register.stepStudies')}
                </Typography>
                <FormGroup>
                  {researchModules.map((rm) => (
                    <FormControlLabel
                      key={rm.id}
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedModuleIds.includes(rm.id)}
                          onChange={(e) =>
                            setSelectedModuleIds((prev) =>
                              e.target.checked
                                ? [...prev, rm.id]
                                : prev.filter((id) => id !== rm.id),
                            )
                          }
                        />
                      }
                      label={
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          <ScienceIcon fontSize="small" color="secondary" />
                          <Typography variant="body2">{rm.studyName}</Typography>
                        </Stack>
                      }
                    />
                  ))}
                </FormGroup>
              </>
            )}
          </Stack>
        )}

        {/* ── Step 1: Conflict resolution ── */}
        {wizardStep === 1 && (
          <Stack gap={2}>
            {loadingConflicts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            ) : conflicts.length === 0 ? (
              <Alert severity="success" icon={<MergeIcon />}>
                {t('patients.conflicts.none')}
              </Alert>
            ) : (
              <>
                <Alert severity="info" icon={<MergeIcon />}>
                  {t('patients.conflicts.hint')}
                </Alert>
                <FormGroup>
                  {conflicts.map((c) => {
                    const isMerged = mergedStepIds.some((m) => m.stepId === c.newStep.id)
                    return (
                      <FormControlLabel
                        key={c.newStep.id}
                        sx={{
                          alignItems: 'flex-start',
                          border: 1,
                          borderColor: isMerged ? 'primary.light' : 'divider',
                          borderRadius: 1,
                          px: 1,
                          py: 0.5,
                          mb: 0.5,
                          bgcolor: isMerged ? 'primary.50' : 'transparent',
                        }}
                        control={
                          <Checkbox
                            size="small"
                            checked={isMerged}
                            onChange={(e) =>
                              toggleMerge(c.newStep.id, c.existingJourneyId, e.target.checked)
                            }
                            sx={{ mt: 0.25 }}
                          />
                        }
                        label={
                          <Stack gap={0}>
                            <Typography variant="body2" fontWeight={600}>
                              {c.newStep.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('patients.conflicts.scheduledOn')}{' '}
                              {new Date(c.newStep.scheduledDate).toLocaleDateString()} —{' '}
                              {t('patients.conflicts.existingOn')}{' '}
                              {new Date(c.existingStep.scheduledDate).toLocaleDateString()} (
                              {t('patients.conflicts.overlapDays', { count: c.overlapDays })})
                            </Typography>
                          </Stack>
                        }
                      />
                    )
                  })}
                </FormGroup>
              </>
            )}
          </Stack>
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
