import React from 'react'
import { Controller } from 'react-hook-form'
import {
  FormControl,
  FormHelperText,
  FormLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import type { AssignmentMode, CareRole } from '@/api/schemas'
import type { Control, FieldError, UseFormSetValue } from 'react-hook-form'

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
            aria-label={tr('triage.assignmentMode')}
            color="primary"
          >
            <Tooltip title={tr('triage.assignmentModeHelp.ANY')}>
              <ToggleButton value="ANY" aria-label={tr('triage.assignmentModeOption.ANY')}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <span>{tr('triage.assignmentModeOption.ANY')}</span>
                </Stack>
              </ToggleButton>
            </Tooltip>

            {careRole === 'DOCTOR' && (
              <Tooltip title={tr('triage.assignmentModeHelp.PAL')}>
                <ToggleButton value="PAL" aria-label={tr('triage.assignmentModeOption.PAL')}>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <span>{tr('triage.assignmentModeOption.PAL')}</span>
                  </Stack>
                </ToggleButton>
              </Tooltip>
            )}

            <Tooltip title={tr('triage.assignmentModeHelp.NAMED')}>
              <ToggleButton value="NAMED" aria-label={tr('triage.assignmentModeOption.NAMED')}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <span>{tr('triage.assignmentModeOption.NAMED')}</span>
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
