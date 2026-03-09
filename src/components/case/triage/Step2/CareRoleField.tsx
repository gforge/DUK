import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import VaccinesIcon from '@mui/icons-material/Vaccines'
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

import type { TriageForm } from '../schema'

interface Props {
  control: Control<TriageForm>
  error?: FieldError
  assignmentMode: AssignmentMode
  setValue: UseFormSetValue<TriageForm>
}

const CARE_ROLE_ICONS: Record<Exclude<CareRole, null>, React.ReactNode> = {
  DOCTOR: <MedicalServicesIcon fontSize="small" />,
  NURSE: <VaccinesIcon fontSize="small" />,
  PHYSIO: <AccessibilityNewIcon fontSize="small" />,
}

export function CareRoleField({ control, error, assignmentMode, setValue }: Props) {
  const { t } = useTranslation()
  const tr = (key: string) => t(key as never)

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
            {tr('triage.careRole')}
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
            aria-label={tr('triage.careRole')}
            color="primary"
          >
            <ToggleButton value="DOCTOR" aria-label={tr('triage.careRoleOption.DOCTOR')}>
              <Stack direction="row" alignItems="center" gap={0.75}>
                {CARE_ROLE_ICONS.DOCTOR}
                <span>{tr('triage.careRoleOption.DOCTOR')}</span>
              </Stack>
            </ToggleButton>

            <ToggleButton value="NURSE" aria-label={tr('triage.careRoleOption.NURSE')}>
              <Stack direction="row" alignItems="center" gap={0.75}>
                {CARE_ROLE_ICONS.NURSE}
                <span>{tr('triage.careRoleOption.NURSE')}</span>
              </Stack>
            </ToggleButton>

            <ToggleButton value="PHYSIO" aria-label={tr('triage.careRoleOption.PHYSIO')}>
              <Stack direction="row" alignItems="center" gap={0.75}>
                {CARE_ROLE_ICONS.PHYSIO}
                <span>{tr('triage.careRoleOption.PHYSIO')}</span>
              </Stack>
            </ToggleButton>
          </ToggleButtonGroup>

          {error && <FormHelperText>{tr('triage.validation.careRoleRequired')}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}
