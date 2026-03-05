import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useTranslation } from 'react-i18next'
import { useSnack } from '../../store/snackContext'
import * as client from '../../api/client'
import type { QuestionnaireTemplate, Question } from '../../api/schemas'
import type { MergedDueStep } from '../../api/service'
import type { JourneyStepContext } from '../../api/service/forms'

interface Props {
  step: MergedDueStep
  template: QuestionnaireTemplate
  patientId: string
  caseId: string
  onDone: () => void
  onCancel: () => void
}

export default function PatientQuestionnaireForm({
  step,
  template,
  patientId,
  caseId,
  onDone,
  onCancel,
}: Props) {
  const { t, i18n } = useTranslation()
  const { showSnack } = useSnack()
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({})
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  const lang = i18n.language

  function getLabel(q: Question): string {
    return q.label[lang] || q.label['sv'] || q.label['en'] || q.key
  }

  function getOptionLabel(opt: { value: string; label: Record<string, string> }): string {
    return opt.label[lang] || opt.label['sv'] || opt.label['en'] || opt.value
  }

  function setAnswer(key: string, value: string | number | boolean) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: false }))
  }

  function validate(): boolean {
    const newErrors: Record<string, boolean> = {}
    for (const q of template.questions) {
      if (q.required && answers[q.key] === undefined) {
        newErrors[q.key] = true
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return

    setSubmitting(true)
    try {
      const journeyContext: JourneyStepContext | undefined =
        step.journeyIds.length > 0 && step.occurrenceIndex !== undefined
          ? {
              patientJourneyId: step.journeyIds[0],
              journeyStepId: step.id.replace(/__r\d+$/, ''),
              occurrenceIndex: step.occurrenceIndex,
            }
          : step.journeyIds.length > 0
            ? {
                patientJourneyId: step.journeyIds[0],
                journeyStepId: step.id.replace(/__r\d+$/, ''),
                occurrenceIndex: 0,
              }
            : undefined

      await client.submitFormResponse(patientId, caseId, template.id, answers, journeyContext)
      showSnack(t('patient.form.submitted'), 'success')
      onDone()
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={onCancel}
          sx={{ mr: 'auto', minWidth: 0 }}
        >
          {t('common.back')}
        </Button>
      </Stack>

      <Typography variant="h6" fontWeight={700} mb={0.5}>
        {template.name}
      </Typography>

      {step.label && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          {step.label} — {t('journey.scheduledDate')}: {step.scheduledDate}
        </Typography>
      )}

      <Stack spacing={3} mt={2}>
        {template.questions.map((q) => (
          <QuestionField
            key={q.id}
            question={q}
            value={answers[q.key]}
            error={errors[q.key]}
            label={getLabel(q)}
            getOptionLabel={getOptionLabel}
            onChange={(val) => setAnswer(q.key, val)}
          />
        ))}
      </Stack>

      <Stack direction="row" justifyContent="flex-end" mt={4}>
        <Button
          variant="contained"
          size="large"
          disableElevation
          startIcon={submitting ? <CircularProgress size={18} /> : <SendIcon />}
          disabled={submitting}
          onClick={handleSubmit}
        >
          {t('patient.form.submit')}
        </Button>
      </Stack>
    </Paper>
  )
}

// ---------------------------------------------------------------------------
// Individual question renderers
// ---------------------------------------------------------------------------

interface QuestionFieldProps {
  question: Question
  value: string | number | boolean | undefined
  error?: boolean
  label: string
  getOptionLabel: (opt: { value: string; label: Record<string, string> }) => string
  onChange: (val: string | number | boolean) => void
}

function QuestionField({
  question,
  value,
  error,
  label,
  getOptionLabel,
  onChange,
}: QuestionFieldProps) {
  const { t } = useTranslation()

  switch (question.type) {
    case 'SCALE': {
      const min = question.min ?? 0
      const max = question.max ?? 10
      const current = typeof value === 'number' ? value : min
      return (
        <FormControl error={error} fullWidth>
          <FormLabel>{label}</FormLabel>
          <Box sx={{ px: 1, mt: 1 }}>
            <Slider
              value={current}
              min={min}
              max={max}
              step={1}
              marks={Array.from({ length: max - min + 1 }, (_, i) => ({
                value: min + i,
                label: String(min + i),
              }))}
              valueLabelDisplay="auto"
              onChange={(_, v) => onChange(v as number)}
              aria-label={label}
            />
          </Box>
          {error && <FormHelperText>{t('patient.form.required')}</FormHelperText>}
        </FormControl>
      )
    }

    case 'BOOLEAN':
      return (
        <FormControl error={error} fullWidth>
          <FormLabel>{label}</FormLabel>
          <RadioGroup
            row
            value={value === true ? 'true' : value === false ? 'false' : ''}
            onChange={(e) => onChange(e.target.value === 'true')}
          >
            <FormControlLabel value="true" control={<Radio />} label={t('common.yes')} />
            <FormControlLabel value="false" control={<Radio />} label={t('common.no')} />
          </RadioGroup>
          {error && <FormHelperText>{t('patient.form.required')}</FormHelperText>}
        </FormControl>
      )

    case 'TEXT':
      return (
        <TextField
          label={label}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          multiline
          rows={3}
          fullWidth
          error={error}
          helperText={error ? t('patient.form.required') : undefined}
          required={question.required}
        />
      )

    case 'SELECT':
      return (
        <TextField
          select
          label={label}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
          error={error}
          helperText={error ? t('patient.form.required') : undefined}
          required={question.required}
        >
          {(question.options ?? []).map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {getOptionLabel(opt)}
            </MenuItem>
          ))}
        </TextField>
      )

    case 'NUMBER': {
      return (
        <TextField
          type="number"
          label={label}
          value={value !== undefined ? String(value) : ''}
          onChange={(e) => onChange(Number(e.target.value))}
          fullWidth
          error={error}
          helperText={error ? t('patient.form.required') : undefined}
          required={question.required}
          inputProps={{
            min: question.min,
            max: question.max,
          }}
        />
      )
    }

    default:
      return (
        <Alert severity="warning">{t('patient.form.unknownType', { type: question.type })}</Alert>
      )
  }
}
