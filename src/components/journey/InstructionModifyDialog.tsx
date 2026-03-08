import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import EventRepeatIcon from '@mui/icons-material/EventRepeat'
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
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { InstructionTemplate } from '@/api/schemas'
import type { ResolvedInstruction } from '@/api/service'
import { useApi } from '@/hooks/useApi'

interface Props {
  open: boolean
  onClose: () => void
  journeyId: string
  /** null = "add new" mode; non-null = reschedule/cancel existing */
  instruction: ResolvedInstruction | null
  /** Which tab to open when instruction is non-null (0=reschedule, 1=cancel). Defaults to 0. */
  initialTab?: number
  onChanged: () => void
}

export function InstructionModifyDialog({
  open,
  onClose,
  journeyId,
  instruction,
  initialTab,
  onChanged,
}: Props) {
  const { t } = useTranslation()

  // Tabs: 0 = reschedule, 1 = cancel, 2 = add (when instruction is null, start at 2)
  const [tab, setTab] = useState<number>(instruction === null ? 2 : (initialTab ?? 0))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reschedule fields (prefill from existing instruction)
  const [rescheduleStart, setRescheduleStart] = useState(String(instruction?.startDayOffset ?? 0))
  const [rescheduleEnd, setRescheduleEnd] = useState(
    instruction?.endDayOffset !== undefined ? String(instruction.endDayOffset) : '',
  )

  // Add fields
  const [addTemplateId, setAddTemplateId] = useState('')
  const [addStart, setAddStart] = useState('0')
  const [addEnd, setAddEnd] = useState('')

  const { data: instructionTemplates } = useApi(() => client.getInstructionTemplates(), [])

  const reset = () => {
    setTab(instruction === null ? 2 : (initialTab ?? 0))
    setError(null)
    setSaving(false)
    setRescheduleStart(String(instruction?.startDayOffset ?? 0))
    setRescheduleEnd(
      instruction?.endDayOffset !== undefined ? String(instruction.endDayOffset) : '',
    )
    setAddTemplateId('')
    setAddStart('0')
    setAddEnd('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleReschedule = async () => {
    if (!instruction) return
    const startDayOffset = parseInt(rescheduleStart, 10)
    if (Number.isNaN(startDayOffset)) {
      setError(t('journey.instructionModify.invalidOffset'))
      return
    }
    const endDayOffset = rescheduleEnd !== '' ? parseInt(rescheduleEnd, 10) : undefined
    if (rescheduleEnd !== '' && Number.isNaN(endDayOffset)) {
      setError(t('journey.instructionModify.invalidOffset'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await client.updateInstructionSchedule(instruction.id, { startDayOffset, endDayOffset })
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!instruction) return
    setSaving(true)
    setError(null)
    try {
      await client.cancelInstruction(instruction.id, 'MANUAL')
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
      setSaving(false)
    }
  }

  const handleAdd = async () => {
    if (!addTemplateId) {
      setError(t('journey.instructionModify.templateRequired'))
      return
    }
    const startDayOffset = parseInt(addStart, 10)
    if (Number.isNaN(startDayOffset)) {
      setError(t('journey.instructionModify.invalidOffset'))
      return
    }
    const endDayOffset = addEnd !== '' ? parseInt(addEnd, 10) : undefined
    if (addEnd !== '' && Number.isNaN(endDayOffset)) {
      setError(t('journey.instructionModify.invalidOffset'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await client.addJourneyInstruction(journeyId, {
        instructionTemplateId: addTemplateId,
        startDayOffset,
        endDayOffset,
      })
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
      setSaving(false)
    }
  }

  const isAddMode = instruction === null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isAddMode
          ? t('journey.instructionModify.addTitle')
          : t('journey.instructionModify.modifyTitle', {
              name: instruction.label || instruction.templateName,
            })}
      </DialogTitle>

      <DialogContent>
        {!isAddMode && (
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setError(null)
              setTab(v as number)
            }}
            sx={{ mb: 2 }}
          >
            <Tab
              icon={<EventRepeatIcon fontSize="small" />}
              iconPosition="start"
              label={t('journey.instructionModify.rescheduleTab')}
              value={0}
            />
            <Tab
              icon={<CancelOutlinedIcon fontSize="small" />}
              iconPosition="start"
              label={t('journey.instructionModify.cancelTab')}
              value={1}
              disabled={instruction?.status === 'CANCELLED'}
            />
            <Tab
              icon={<AddCircleOutlineIcon fontSize="small" />}
              iconPosition="start"
              label={t('journey.instructionModify.addTab')}
              value={2}
            />
          </Tabs>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Reschedule tab */}
        {tab === 0 && !isAddMode && (
          <Stack gap={2}>
            <Typography variant="body2" color="text.secondary">
              {t('journey.instructionModify.rescheduleHint')}
            </Typography>
            <TextField
              label={t('journey.instructionModify.startOffset')}
              helperText={t('journey.instructionModify.offsetHelp')}
              value={rescheduleStart}
              onChange={(e) => setRescheduleStart(e.target.value)}
              size="small"
              type="number"
              fullWidth
            />
            <TextField
              label={t('journey.instructionModify.endOffset')}
              helperText={t('journey.instructionModify.endOffsetHelp')}
              value={rescheduleEnd}
              onChange={(e) => setRescheduleEnd(e.target.value)}
              size="small"
              type="number"
              fullWidth
            />
          </Stack>
        )}

        {/* Cancel tab */}
        {tab === 1 && !isAddMode && (
          <Stack gap={2}>
            <Alert severity="warning">
              {t('journey.instructionModify.cancelWarning', {
                name: instruction?.label || instruction?.templateName,
              })}
            </Alert>
          </Stack>
        )}

        {/* Add tab */}
        {tab === 2 && (
          <Stack gap={2}>
            <FormControl size="small" fullWidth required>
              <InputLabel>{t('journey.instructionModify.templateLabel')}</InputLabel>
              <Select
                value={addTemplateId}
                onChange={(e) => setAddTemplateId(e.target.value)}
                label={t('journey.instructionModify.templateLabel')}
              >
                {(instructionTemplates ?? []).map((tpl: InstructionTemplate) => (
                  <MenuItem key={tpl.id} value={tpl.id}>
                    <Stack>
                      <span>{tpl.name}</span>
                      {tpl.tags?.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {tpl.tags.join(', ')}
                        </Typography>
                      )}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t('journey.instructionModify.startOffset')}
              helperText={t('journey.instructionModify.offsetHelp')}
              value={addStart}
              onChange={(e) => setAddStart(e.target.value)}
              size="small"
              type="number"
              fullWidth
            />
            <TextField
              label={t('journey.instructionModify.endOffset')}
              helperText={t('journey.instructionModify.endOffsetHelp')}
              value={addEnd}
              onChange={(e) => setAddEnd(e.target.value)}
              size="small"
              type="number"
              fullWidth
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        {tab === 0 && !isAddMode && (
          <Button variant="contained" onClick={handleReschedule} disabled={saving} disableElevation>
            {saving ? t('common.saving') : t('journey.instructionModify.rescheduleConfirm')}
          </Button>
        )}
        {tab === 1 && !isAddMode && (
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={saving}
            disableElevation
          >
            {saving ? t('common.saving') : t('journey.instructionModify.cancelConfirm')}
          </Button>
        )}
        {tab === 2 && (
          <Button variant="contained" onClick={handleAdd} disabled={saving} disableElevation>
            {saving ? t('common.saving') : t('journey.instructionModify.addConfirm')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
