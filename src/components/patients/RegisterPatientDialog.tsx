import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ScienceIcon from '@mui/icons-material/Science'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../hooks/useApi'
import { useSnack } from '../../store/snackContext'
import * as client from '../../api/client'
import { parsePersonnummer } from '../../api/utils/personnummer'

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
          <Stack gap={2}>
            {/* Personnummer input + lookup button */}
            <Stack direction="row" gap={1} alignItems="flex-start">
              <TextField
                label={t('patients.personalNumber')}
                value={personalNumber}
                onChange={(e) => {
                  setPersonalNumber(e.target.value)
                  setLookupStatus('idle')
                  setRegisterName(null)
                  setDisplayName('')
                  setDateOfBirth('')
                }}
                size="small"
                fullWidth
                required
                autoFocus
                placeholder="YYYYMMDD-XXXX"
              />
              <Button
                variant="outlined"
                onClick={handleLookup}
                disabled={lookupStatus === 'loading' || !personalNumber.trim()}
                sx={{ whiteSpace: 'nowrap', flexShrink: 0, height: 40 }}
              >
                {lookupStatus === 'loading' ? (
                  <CircularProgress size={18} />
                ) : (
                  t('patients.register.fetchFromRegister')
                )}
              </Button>
            </Stack>

            {/* Reservnummer notice */}
            {pnrInfo.isValid && pnrInfo.isReservnummer && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                {t('patients.register.reservnummerDetected')}
              </Alert>
            )}

            {/* Lookup: found */}
            {lookupStatus === 'found' && registerName && (
              <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ py: 0.5 }}>
                {t('patients.register.foundInRegister')}: <strong>{registerName}</strong>
              </Alert>
            )}

            {/* Lookup: not found */}
            {lookupStatus === 'not-found' && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                {t('patients.register.notFoundInRegister')}
              </Alert>
            )}

            {/* Name field */}
            {(lookupStatus === 'found' || lookupStatus === 'not-found') && (
              <TextField
                label={
                  lookupStatus === 'found'
                    ? t('patients.register.nameOverride')
                    : t('patients.displayName')
                }
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                size="small"
                fullWidth
                required={lookupStatus === 'not-found'}
                placeholder={lookupStatus === 'found' ? (registerName ?? '') : 'Anna Johansson'}
                helperText={
                  lookupStatus === 'found' ? t('patients.register.nameOverrideHint') : undefined
                }
              />
            )}

            {/* Date of birth — only for reservnummer */}
            {(lookupStatus === 'found' || lookupStatus === 'not-found') &&
              pnrInfo.isReservnummer && (
                <TextField
                  label={t('patients.dateOfBirth')}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  size="small"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              )}

            {/* Demo help box: available persons in the fake register */}
            <Box
              sx={{
                border: 1,
                borderColor: 'info.light',
                borderRadius: 1,
                bgcolor: 'info.50',
                overflow: 'hidden',
              }}
            >
              <Button
                fullWidth
                size="small"
                onClick={() => setHintOpen((v) => !v)}
                startIcon={<InfoOutlinedIcon color="info" />}
                endIcon={hintOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  color: 'info.dark',
                  fontWeight: 600,
                  px: 1.5,
                  py: 1,
                  borderRadius: 0,
                }}
              >
                {t('patients.register.demoHintTitle')}
              </Button>

              <Collapse in={hintOpen}>
                <Box sx={{ px: 1.5, pb: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    {t('patients.register.demoHintDescription')}
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.7rem' }}>
                          {t('patients.displayName')}
                        </TableCell>
                        <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.7rem' }}>
                          {t('patients.personalNumber')}
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(demoHints ?? []).map((hint) => {
                        const alreadyRegistered =
                          registeredPnrs.has(hint.pnr12) || registeredPnrs.has(hint.pnr12.slice(2))
                        return (
                          <TableRow
                            key={hint.pnr12}
                            hover={!alreadyRegistered}
                            sx={{
                              cursor: alreadyRegistered ? 'default' : 'pointer',
                              opacity: alreadyRegistered ? 0.5 : 1,
                            }}
                            onClick={() => !alreadyRegistered && fillPnr(hint.pnr)}
                          >
                            <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                              {hint.displayName}
                            </TableCell>
                            <TableCell
                              sx={{ py: 0.5, fontSize: '0.75rem', fontFamily: 'monospace' }}
                            >
                              {hint.pnr}
                            </TableCell>
                            <TableCell sx={{ py: 0.5 }}>
                              {alreadyRegistered && (
                                <Chip
                                  label={t('patients.register.demoHintAlreadyRegistered')}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.65rem', height: 18 }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </Collapse>
            </Box>
          </Stack>
        )}

        {/* ── Step 1: Journey assignment ── */}
        {step === 1 && (
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
                    <Stack>
                      <span>{jt.name}</span>
                      {jt.description && (
                        <Typography variant="caption" color="text.secondary">
                          {jt.description}
                        </Typography>
                      )}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={selectedTemplate?.referenceDateLabel ?? t('patients.register.referenceDate')}
              helperText={t('patients.register.referenceDateHint', {
                label: selectedTemplate?.referenceDateLabel ?? t('patients.register.referenceDate'),
              })}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        )}

        {/* ── Step 2: Research modules ── */}
        {step === 2 && (
          <Stack gap={2}>
            <Typography variant="body2" color="text.secondary">
              {t('patients.register.studiesHint')}
            </Typography>
            {!researchModules || researchModules.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {t('patients.register.noStudies')}
              </Typography>
            ) : (
              <FormGroup>
                {researchModules.map((rm) => (
                  <FormControlLabel
                    key={rm.id}
                    control={
                      <Checkbox
                        checked={selectedModuleIds.includes(rm.id)}
                        onChange={(e) =>
                          setSelectedModuleIds((prev) =>
                            e.target.checked ? [...prev, rm.id] : prev.filter((id) => id !== rm.id),
                          )
                        }
                      />
                    }
                    label={
                      <Stack gap={0}>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          <ScienceIcon fontSize="small" color="secondary" />
                          <Typography variant="body2" fontWeight={600}>
                            {rm.studyName}
                          </Typography>
                        </Stack>
                        {rm.name !== rm.studyName && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5 }}>
                            {rm.name}
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                ))}
              </FormGroup>
            )}
          </Stack>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <Stack gap={1.5}>
            <Typography variant="subtitle2" fontWeight={600}>
              {t('patients.register.reviewTitle')}
            </Typography>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
              <Stack gap={0.5}>
                <Typography variant="body2">
                  <strong>{t('patients.displayName')}:</strong> {effectiveName}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('patients.personalNumber')}:</strong> {personalNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('patients.dateOfBirth')}:</strong> {pnrInfo.dateOfBirth ?? dateOfBirth}
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
              <Stack gap={0.5}>
                <Typography variant="body2">
                  <strong>{t('nav.journeys')}:</strong> {selectedTemplate?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>{selectedTemplate?.referenceDateLabel ?? t('journey.startDate')}:</strong>{' '}
                  {startDate}
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
              <Stack gap={0.5}>
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
