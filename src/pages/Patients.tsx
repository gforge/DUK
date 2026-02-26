import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
import PersonIcon from '@mui/icons-material/Person'
import RouteIcon from '@mui/icons-material/Route'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import * as client from '../api/client'
import { useSnack } from '../store/snackContext'
import { useRole } from '../store/roleContext'

// ─── Personnummer helpers ──────────────────────────────────────────────────────

interface PnrInfo {
  isValid: boolean
  isReservnummer: boolean // day part > 60 → coordination/reserve number
  dateOfBirth: string | null // YYYY-MM-DD, null for reservnummer or invalid
}

function parsePersonnummer(pnr: string): PnrInfo {
  const clean = pnr.replace(/[-+ ]/g, '')
  if (!/^\d{10}$|^\d{12}$/.test(clean)) {
    return { isValid: false, isReservnummer: false, dateOfBirth: null }
  }
  let year: number, month: number, day: number
  if (clean.length === 12) {
    year = parseInt(clean.slice(0, 4))
    month = parseInt(clean.slice(4, 6))
    day = parseInt(clean.slice(6, 8))
  } else {
    const yy = parseInt(clean.slice(0, 2))
    month = parseInt(clean.slice(2, 4))
    day = parseInt(clean.slice(4, 6))
    const currentYear = new Date().getFullYear()
    const century = yy + 2000 > currentYear ? 1900 : 2000
    year = century + yy
  }
  const isReservnummer = day > 60
  const actualDay = isReservnummer ? day - 60 : day
  const d = new Date(year, month - 1, actualDay)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== actualDay) {
    return { isValid: false, isReservnummer, dateOfBirth: null }
  }
  const dateOfBirth = isReservnummer
    ? null
    : `${year}-${String(month).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`
  return { isValid: true, isReservnummer, dateOfBirth }
}

// ─── Register Patient Dialog ──────────────────────────────────────────────────

interface RegisterDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

function RegisterPatientDialog({ open, onClose, onCreated }: RegisterDialogProps) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 0 — patient details
  const [personalNumber, setPersonalNumber] = useState('')
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not-found'>(
    'idle',
  )
  const [registerName, setRegisterName] = useState<string | null>(null) // name returned from the register
  const [displayName, setDisplayName] = useState('') // manual entry or override
  const [dateOfBirth, setDateOfBirth] = useState('') // only needed for reservnummer

  // Step 1 — journey assignment
  const [journeyTemplateId, setJourneyTemplateId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))

  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])

  const steps = [
    t('patients.register.stepPatient'),
    t('patients.register.stepJourney'),
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
    setError(null)
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
      // Auto-fill DOB when derivable from personnummer
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
      await client.assignPatientJourney(patient.id, journeyTemplateId, startDate)
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

        {step === 0 && (
          <Stack gap={2}>
            {/* Personnummer + lookup */}
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

            {/* Lookup result: found */}
            {lookupStatus === 'found' && registerName && (
              <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ py: 0.5 }}>
                {t('patients.register.foundInRegister')}: <strong>{registerName}</strong>
              </Alert>
            )}

            {/* Lookup result: not found */}
            {lookupStatus === 'not-found' && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                {t('patients.register.notFoundInRegister')}
              </Alert>
            )}

            {/* Name field — override when found, required when not found */}
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

            {/* DOB — only needed for reservnummer (cannot be derived from PNR) */}
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
          </Stack>
        )}

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
          </Stack>
        )}

        {step === 2 && (
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
                  <strong>{t('journey.startDate')}:</strong> {startDate}
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
        {step < 2 ? (
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

// ─── Assign Journey Dialog ─────────────────────────────────────────────────────

interface AssignJourneyDialogProps {
  open: boolean
  onClose: () => void
  patientId: string
  patientName: string
  onAssigned: () => void
}

function AssignJourneyDialog({
  open,
  onClose,
  patientId,
  patientName,
  onAssigned,
}: AssignJourneyDialogProps) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [journeyTemplateId, setJourneyTemplateId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])

  const handleClose = () => {
    setJourneyTemplateId('')
    setStartDate(new Date().toISOString().slice(0, 10))
    setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!journeyTemplateId || !startDate) {
      setError(t('patients.register.journeyRequired'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await client.assignPatientJourney(patientId, journeyTemplateId, startDate)
      showSnack(t('patients.journeyAssigned'), 'success')
      onAssigned()
      handleClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <RouteIcon color="primary" />
          {t('patients.assignJourney')} — {patientName}
        </Stack>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack gap={2} sx={{ mt: 1 }}>
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
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving} disableElevation>
          {saving ? t('common.saving') : t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Patients Page ─────────────────────────────────────────────────────────────

export default function Patients() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isRole } = useRole()
  const [registerOpen, setRegisterOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<{ id: string; name: string } | null>(null)
  const [search, setSearch] = useState('')

  const { data: patients, loading, error, refetch } = useApi(() => client.getPatients(), [])
  const { data: allJourneys } = useApi(() => client.getPatientJourneys(), [])
  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])

  const isClinician = isRole('NURSE') || isRole('DOCTOR') || isRole('PAL')

  const filtered = (patients ?? []).filter(
    (p) =>
      !search.trim() ||
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.personalNumber.includes(search),
  )

  const activeJourneyCount = (patientId: string) =>
    (allJourneys ?? []).filter((j) => j.patientId === patientId && j.status === 'ACTIVE').length

  const latestJourneyName = (patientId: string) => {
    const journeys = (allJourneys ?? [])
      .filter((j) => j.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (!journeys.length) return null
    return journeyTemplates?.find((jt) => jt.id === journeys[0].journeyTemplateId)?.name ?? null
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <PersonIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            {t('patients.title')}
          </Typography>
        </Stack>
        {isClinician && (
          <Button
            variant="contained"
            startIcon={<PersonAddAltIcon />}
            disableElevation
            onClick={() => setRegisterOpen(true)}
          >
            {t('patients.register.action')}
          </Button>
        )}
      </Stack>

      <TextField
        size="small"
        placeholder={t('patients.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 320 }}
      />

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('patients.displayName')}</TableCell>
              <TableCell>{t('patients.personalNumber')}</TableCell>
              <TableCell>{t('patients.dateOfBirth')}</TableCell>
              <TableCell>{t('patients.activeJourney')}</TableCell>
              {isClinician && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">
                    {t('patients.noResults')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((patient) => {
              const count = activeJourneyCount(patient.id)
              const name = latestJourneyName(patient.id)
              return (
                <TableRow
                  key={patient.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {patient.displayName}
                    </Typography>
                  </TableCell>
                  <TableCell>{patient.personalNumber}</TableCell>
                  <TableCell>{patient.dateOfBirth}</TableCell>
                  <TableCell>
                    {name ? (
                      <Chip
                        size="small"
                        icon={<RouteIcon />}
                        label={`${name}${count > 1 ? ` +${count - 1}` : ''}`}
                        color={count > 0 ? 'primary' : 'default'}
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {t('patients.noJourney')}
                      </Typography>
                    )}
                  </TableCell>
                  {isClinician && (
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RouteIcon />}
                        onClick={(e) => {
                          e.stopPropagation()
                          setAssignTarget({ id: patient.id, name: patient.displayName })
                        }}
                      >
                        {t('patients.assignJourney')}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <RegisterPatientDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onCreated={refetch}
      />

      {assignTarget && (
        <AssignJourneyDialog
          open={!!assignTarget}
          onClose={() => setAssignTarget(null)}
          patientId={assignTarget.id}
          patientName={assignTarget.name}
          onAssigned={refetch}
        />
      )}
    </Box>
  )
}
