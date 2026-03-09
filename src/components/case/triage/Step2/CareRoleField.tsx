import {
  FormControl,
  FormHelperText,
  FormLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import React from 'react'
import type { Control, FieldError, UseFormSetValue } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import type { AssignmentMode, CareRole } from '@/api/schemas'
import { CareRoleIcon } from '@/components/common'

import type { TriageForm } from '../schema'

interface Props {
  control: Control<TriageForm>
  error?: FieldError
  assignmentMode: AssignmentMode
  setValue: UseFormSetValue<TriageForm>
}

export function CareRoleField({ control, error, assignmentMode, setValue }: Props) {
  const { t } = useTranslation()

  return (
    <Controller
      name="careRole"
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
            {t('triage.careRole')}
          </FormLabel>

          <ToggleButtonGroup
            exclusive
            value={field.value}
            onChange={(_, nextCareRole: CareRole) => {
              if (!nextCareRole) return

              field.onChange(nextCareRole)

              if (assignmentMode === 'PAL' && nextCareRole !== 'DOCTOR') {
                setValue('assignmentMode', 'ANY')
              }

              if (assignmentMode === 'NAMED') {
                setValue('assignedUserId', '')
              }
            }}
            size="small"
            aria-label={t('triage.careRole')}
            color="primary"
          >
            <ToggleButton value="DOCTOR" aria-label={t('triage.careRoleOption.DOCTOR')}>
              <Stack direction="row" alignItems="center" gap={0.75}>
                <CareRoleIcon role="DOCTOR" />
                <span>{t('triage.careRoleOption.DOCTOR')}</span>
              </Stack>
            </ToggleButton>

            <ToggleButton value="NURSE" aria-label={t('triage.careRoleOption.NURSE')}>
              <Stack direction="row" alignItems="center" gap={0.75}>
                <CareRoleIcon role="NURSE" />
                <span>{t('triage.careRoleOption.NURSE')}</span>
              </Stack>
            </ToggleButton>

            <ToggleButton value="PHYSIO" aria-label={t('triage.careRoleOption.PHYSIO')}>
              <Stack direction="row" alignItems="center" gap={0.75}>
                <CareRoleIcon role="PHYSIO" />
                <span>{t('triage.careRoleOption.PHYSIO')}</span>
              </Stack>
            </ToggleButton>
          </ToggleButtonGroup>

          {error && <FormHelperText>{t('triage.validation.careRoleRequired')}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}
