import React from 'react'
import { Alert, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ScheduleIcon from '@mui/icons-material/Schedule'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../hooks/useApi'
import * as client from '../../api/client'
import type { MergedDueStep } from '../../api/service'
import type { QuestionnaireTemplate } from '../../api/schemas'

interface Props {
  patientId: string
  onSelectForm: (step: MergedDueStep, template: QuestionnaireTemplate) => void
}

export default function PatientDueForms({ patientId, onSelectForm }: Props) {
  const { t } = useTranslation()
  const today = new Date().toISOString().slice(0, 10)

  const {
    data: dueSteps,
    loading,
    error,
  } = useApi(() => client.getMergedDueStepsForPatient(patientId, today), [patientId])

  const { data: templates } = useApi(() => client.getQuestionnaireTemplates(), [])

  if (loading) return <CircularProgress size={24} />
  if (error) return <Alert severity="error">{error}</Alert>
  if (!dueSteps?.length) {
    return (
      <Alert severity="info" icon={<AssignmentIcon />}>
        {t('patient.form.noFormsDue')}
      </Alert>
    )
  }

  const templateMap = new Map(templates?.map((tmpl) => [tmpl.id, tmpl]) ?? [])

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, mb: 3 }}>
      <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
        <AssignmentIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={600}>
          {t('patient.form.dueForms')}
        </Typography>
      </Stack>

      <Stack spacing={1.5}>
        {dueSteps.map((step) => {
          const template = step.templateId ? templateMap.get(step.templateId) : undefined
          if (!template) return null

          const isOverdue = step.scheduledDate < today

          return (
            <Stack
              key={step.id}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                border: 1,
                borderColor: isOverdue ? 'error.light' : 'divider',
                borderRadius: 1,
                px: 2,
                py: 1.5,
                bgcolor: isOverdue ? 'error.50' : undefined,
              }}
            >
              <Stack gap={0.25}>
                <Typography variant="body2" fontWeight={600}>
                  {template.name}
                </Typography>
                <Stack direction="row" gap={1} alignItems="center">
                  <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {step.scheduledDate}
                  </Typography>
                  {isOverdue && (
                    <Chip
                      label={t('patient.form.overdue')}
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ height: 18, fontSize: 10 }}
                    />
                  )}
                </Stack>
              </Stack>
              <Button
                variant="contained"
                size="small"
                disableElevation
                onClick={() => onSelectForm(step, template)}
                aria-label={t('patient.form.fillIn_name', { name: template.name })}
              >
                {t('patient.form.fillIn')}
              </Button>
            </Stack>
          )
        })}
      </Stack>
    </Paper>
  )
}
