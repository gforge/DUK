import React from 'react'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { EffectiveStep } from '@/api/service'
import type { QuestionnaireTemplate } from '@/api/schemas'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

// ─── Add Step ─────────────────────────────────────────────────────────────────

interface AddStepProps {
  label: string
  setLabel: (v: string) => void
  offset: string
  setOffset: (v: string) => void
  window: string
  setWindow: (v: string) => void
  templateId: string
  setTemplateId: (v: string) => void
  reason: string
  setReason: (v: string) => void
  questionnaireTemplates: QuestionnaireTemplate[]
}

export function AddStepForm({
  label,
  setLabel,
  offset,
  setOffset,
  window: windowVal,
  setWindow,
  templateId,
  setTemplateId,
  reason,
  setReason,
  questionnaireTemplates,
}: AddStepProps) {
  const { t } = useTranslation()
  return (
    <Stack gap={2}>
      <TextField
        label={t('journey.modify.stepLabel')}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        size="small"
        fullWidth
        placeholder={t('journey.modify.stepLabelPlaceholder')}
      />
      <Stack direction="row" gap={1}>
        <TextField
          label={t('journey.modify.offsetDays')}
          value={offset}
          onChange={(e) => setOffset(e.target.value)}
          size="small"
          type="number"
          sx={{ flex: 1 }}
          inputProps={{ min: 0 }}
        />
        <TextField
          label={t('journey.modify.windowDays')}
          value={windowVal}
          onChange={(e) => setWindow(e.target.value)}
          size="small"
          type="number"
          sx={{ width: 120 }}
          inputProps={{ min: 0 }}
        />
      </Stack>
      <FormControl size="small" fullWidth>
        <InputLabel>{t('journey.modify.questionnaire')}</InputLabel>
        <Select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          label={t('journey.modify.questionnaire')}
        >
          {questionnaireTemplates.map((qt) => (
            <MenuItem key={qt.id} value={qt.id}>
              {qt.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label={t('journey.modify.reason')}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        size="small"
        fullWidth
        multiline
        rows={2}
        required
        placeholder={t('journey.modify.reasonPlaceholder')}
      />
    </Stack>
  )
}

// ─── Remove Step ──────────────────────────────────────────────────────────────

interface RemoveStepProps {
  steps: EffectiveStep[]
  selectedStepId: string
  onSelectStep: (id: string) => void
  reason: string
  setReason: (v: string) => void
}

export function RemoveStepForm({
  steps,
  selectedStepId,
  onSelectStep,
  reason,
  setReason,
}: RemoveStepProps) {
  const { t } = useTranslation()
  return (
    <Stack gap={2}>
      <Typography variant="body2" color="text.secondary">
        {t('journey.modify.removeStepHint')}
      </Typography>
      <Stack gap={0}>
        {steps.map((step) => (
          <Stack
            key={step.id}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 1, py: 0.75, border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5 }}
          >
            <Stack>
              <Typography variant="body2" fontWeight={600}>
                {step.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {step.scheduledDate} · {step.templateId}
              </Typography>
            </Stack>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => onSelectStep(step.id)}
              variant={selectedStepId === step.id ? 'contained' : 'outlined'}
              disableElevation
            >
              {t('journey.modify.select')}
            </Button>
          </Stack>
        ))}
      </Stack>
      <TextField
        label={t('journey.modify.reason')}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        size="small"
        fullWidth
        multiline
        rows={2}
        required
        placeholder={t('journey.modify.reasonPlaceholder')}
      />
    </Stack>
  )
}

// ─── Switch Template ──────────────────────────────────────────────────────────

interface SwitchTemplateProps {
  currentTemplateName: string
  otherTemplates: Array<{ id: string; name: string; description?: string }>
  selectedTemplateId: string
  onSelectTemplate: (id: string) => void
  reason: string
  setReason: (v: string) => void
  /** Optional new anchor date (e.g. surgery date). Resets all step offsets. */
  newStartDate: string
  setNewStartDate: (v: string) => void
}

export function SwitchTemplateForm({
  currentTemplateName,
  otherTemplates,
  selectedTemplateId,
  onSelectTemplate,
  reason,
  setReason,
  newStartDate,
  setNewStartDate,
}: SwitchTemplateProps) {
  const { t } = useTranslation()
  return (
    <Stack gap={2}>
      <Typography variant="body2">
        {t('journey.modify.currentTemplate')}: <strong>{currentTemplateName}</strong>
      </Typography>
      <FormControl size="small" fullWidth>
        <InputLabel>{t('journey.modify.newTemplate')}</InputLabel>
        <Select
          value={selectedTemplateId}
          onChange={(e) => onSelectTemplate(e.target.value)}
          label={t('journey.modify.newTemplate')}
        >
          {otherTemplates.map((jt) => (
            <MenuItem key={jt.id} value={jt.id}>
              {jt.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {selectedTemplateId && (
        <Typography variant="caption" color="text.secondary">
          {otherTemplates.find((t) => t.id === selectedTemplateId)?.description}
        </Typography>
      )}
      <TextField
        label={t('journey.modify.newStartDate')}
        helperText={t('journey.modify.newStartDateHint')}
        value={newStartDate}
        onChange={(e) => setNewStartDate(e.target.value)}
        size="small"
        type="date"
        fullWidth
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label={t('journey.modify.reason')}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        size="small"
        fullWidth
        multiline
        rows={2}
        required
        placeholder={t('journey.modify.reasonPlaceholderSwitch')}
      />
    </Stack>
  )
}
