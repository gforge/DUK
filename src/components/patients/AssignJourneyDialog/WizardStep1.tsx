import React from 'react'
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from '@mui/material'
import MergeIcon from '@mui/icons-material/MergeType'
import { useTranslation } from 'react-i18next'
import type { JourneyStepConflict } from '@/api/service'

interface MergedStepRef {
  readonly stepId: string
  readonly fromJourneyId: string
}

interface Props {
  readonly loadingConflicts: boolean
  readonly conflicts: JourneyStepConflict[]
  readonly mergedStepIds: MergedStepRef[]
  readonly onToggleMerge: (stepId: string, fromJourneyId: string, checked: boolean) => void
}

export default function WizardStep1({
  loadingConflicts,
  conflicts,
  mergedStepIds,
  onToggleMerge,
}: Props) {
  const { t } = useTranslation()

  if (loadingConflicts) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (conflicts.length === 0) {
    return (
      <Alert severity="success" icon={<MergeIcon />}>
        {t('patients.conflicts.none')}
      </Alert>
    )
  }

  return (
    <Stack gap={2}>
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
                    onToggleMerge(c.newStep.id, c.existingJourneyId, e.target.checked)
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
    </Stack>
  )
}
