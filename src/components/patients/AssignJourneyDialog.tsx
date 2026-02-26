import React, { useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import RouteIcon from '@mui/icons-material/Route'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../hooks/useApi'
import { useSnack } from '../../store/snackContext'
import * as client from '../../api/client'

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
