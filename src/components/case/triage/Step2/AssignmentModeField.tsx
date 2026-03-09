import {
  FormControl,
  FormHelperText,
  FormLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material'
import React from 'react'
import type { Control, FieldError, UseFormSetValue } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import type { AssignmentMode, CareRole } from '@/api/schemas'

import type { TriageForm } from '../schema'

interface Props {
  control: Control<TriageForm>
  error?: FieldError
  careRole: CareRole
  setValue: UseFormSetValue<TriageForm>
}

export function AssignmentModeField({ control, error, careRole, setValue }: Props) {
  const { t } = useTranslation()

  return (
    <Controller
      name="assignmentMode"
      control={control}
      render={({ field }) => (
        <FormControl error={Boolean(error)}>
          <FormLabel
            sx={{
              color: error ? 'error.main' : 'text.primary',
              '&.Mui-focused': {
                color: error ? 'error.main' : 'text.primary',
              },
            }}
          >
            {t('triage.assignmentMode')}
          </FormLabel>

          <ToggleButtonGroup
            exclusive
            value={field.value ?? ''}
            onChange={(_, nextMode: AssignmentMode) => {
              if (!nextMode) return
              field.onChange(nextMode)
              if (nextMode !== 'NAMED') {
                setValue('assignedUserId', '')
              }
            }}
            size="small"
            aria-label={t('triage.assignmentMode')}
            color="primary"
          >
            <Tooltip title={t('triage.assignmentModeHelp.ANY')}>
              <ToggleButton value="ANY" aria-label={t('triage.assignmentModeOption.ANY')}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <span>{t('triage.assignmentModeOption.ANY')}</span>
                </Stack>
              </ToggleButton>
            </Tooltip>

            {careRole === 'DOCTOR' && (
              <Tooltip title={t('triage.assignmentModeHelp.PAL')}>
                <ToggleButton value="PAL" aria-label={t('triage.assignmentModeOption.PAL')}>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <span>{t('triage.assignmentModeOption.PAL')}</span>
                  </Stack>
                </ToggleButton>
              </Tooltip>
            )}

            <Tooltip title={t('triage.assignmentModeHelp.NAMED')}>
              <ToggleButton value="NAMED" aria-label={t('triage.assignmentModeOption.NAMED')}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <span>{t('triage.assignmentModeOption.NAMED')}</span>
                </Stack>
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>

          {error && (
            <FormHelperText>{t('triage.validation.assignmentModeRequired')}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  )
}
