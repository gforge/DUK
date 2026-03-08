import {
  Button,
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
  TextField,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { format } from 'date-fns'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type {
  JourneyTemplate,
  PatientJourney,
  PhaseType,
  TransitionTriggerType,
} from '@/api/schemas'
import { usePhaseTypeLabel, useTransitionTriggerLabel } from '@/hooks/labels'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

const PHASE_TYPES: PhaseType[] = [
  'REFERRAL',
  'INTAKE',
  'FOLLOWUP',
  'WAITING_LIST',
  'POST_OP',
  'MONITORING',
  'DISCHARGE',
]

const TRIGGER_TYPES: TransitionTriggerType[] = [
  'REFERRAL_RECEIVED',
  'TRIAGE_DECISION',
  'VISIT_DECISION',
  'SURGERY_SCHEDULED',
  'SURGERY_COMPLETED',
  'PHYSIO_COMPLETED',
  'MILESTONE',
  'MANUAL',
]

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly journey: PatientJourney
  readonly journeyTemplates: JourneyTemplate[]
  readonly onCompleted: () => void
}

export default function StartNextPhaseDialog({
  open,
  onClose,
  journey,
  journeyTemplates,
  onCompleted,
}: Props) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const { currentUser } = useRole()
  const phaseTypeLabel = usePhaseTypeLabel()
  const transitionTriggerLabel = useTransitionTriggerLabel()

  const [templateId, setTemplateId] = useState(journey.journeyTemplateId)
  const [phaseType, setPhaseType] = useState<PhaseType>('FOLLOWUP')
  const [startDate, setStartDate] = useState<Date | null>(new Date())
  const [triggerType, setTriggerType] = useState<TransitionTriggerType>('MANUAL')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!startDate) return
    setLoading(true)
    try {
      await client.startNextPhase({
        fromJourneyId: journey.id,
        journeyTemplateId: templateId,
        startDate: format(startDate, 'yyyy-MM-dd'),
        phaseType,
        trigger: {
          type: triggerType,
          triggeredByUserId: currentUser.id,
          note: note.trim() || undefined,
        },
      })
      showSnack(t('journey.nextPhase.success'), 'success')
      onCompleted()
    } catch {
      showSnack(t('common.errorUnknown', { defaultValue: 'An error occurred' }), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('journey.nextPhase.title')}</DialogTitle>
      <DialogContent>
        <Stack gap={2.5} mt={1}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('journey.nextPhase.template')}</InputLabel>
            <Select
              label={t('journey.nextPhase.template')}
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {journeyTemplates.map((jt) => (
                <MenuItem key={jt.id} value={jt.id}>
                  {jt.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>{t('journey.nextPhase.phaseType')}</InputLabel>
            <Select
              label={t('journey.nextPhase.phaseType')}
              value={phaseType}
              onChange={(e) => setPhaseType(e.target.value as PhaseType)}
            >
              {PHASE_TYPES.map((pt) => (
                <MenuItem key={pt} value={pt}>
                  {phaseTypeLabel(pt)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <DatePicker
            label={t('journey.nextPhase.startDate')}
            value={startDate}
            onChange={setStartDate}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />

          <FormControl fullWidth size="small">
            <InputLabel>{t('journey.nextPhase.triggerType')}</InputLabel>
            <Select
              label={t('journey.nextPhase.triggerType')}
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as TransitionTriggerType)}
            >
              {TRIGGER_TYPES.map((tt) => (
                <MenuItem key={tt} value={tt}>
                  {transitionTriggerLabel(tt)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label={t('journey.nextPhase.note')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
            size="small"
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || !startDate}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {t('journey.nextPhase.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
